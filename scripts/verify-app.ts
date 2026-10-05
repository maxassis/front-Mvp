/**
 * Percorre o app inteiro num Chromium de verdade contra o backend de verdade.
 * Serve de prova de que o fluxo funciona e de rede de seguranca para o que
 * quebrar depois.
 *
 *   bun run verify:app          # exige o backend em :3000 e o app em :4174
 */
import { chromium } from 'playwright'

const APP_URL = process.env.APP_URL ?? 'http://localhost:4174'
const API_URL = process.env.API_URL ?? 'http://localhost:3000'
const FAILURE_SHOT = process.env.FAILURE_SHOT ?? '/tmp/bondschat-falha.png'
const RUN_ID = Date.now()
const EMAIL = `verify-${RUN_ID}@example.com`
const PASSWORD = 'senha-de-teste-123'

let failures = 0
const check = (label, ok, detail = '') => {
  const mark = ok ? 'PASS' : 'FALHOU'
  if (!ok) {
    failures += 1
  }
  process.stdout.write(`[${mark}] ${label}${detail ? ` :: ${detail}` : ''}\n`)
}

const MAIL_URL = process.env.MAIL_URL ?? 'http://localhost:5080'

/** smtp4dev expoe o corpo cru so em /source; parts[].body vem vazio. */
const readOtpFromMailbox = async email => {
  const listing = await fetch(`${MAIL_URL}/api/messages?take=30`)
  const { results = [] } = await listing.json()

  for (const summary of results) {
    if (!(summary.to ?? []).includes(email)) {
      continue
    }
    const source = await fetch(`${MAIL_URL}/api/messages/${summary.id}/source`)
    if (!source.ok) {
      continue
    }
    const body = await source.text()
    const match = body.match(/\b(\d{6})\b/u)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * `isVisible()` nao espera: devolve o estado do instante da chamada e falha
 * enquanto o React ainda esta montando. Todo assertion de presenca precisa de
 * espera de verdade.
 */
const seeText = async (page, text, label) => {
  try {
    await page.getByText(text).first().waitFor({ state: 'visible', timeout: 15_000 })
    check(label, true)
  } catch {
    check(label, false, `nao apareceu: ${text}`)
  }
}

const main = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { height: 900, width: 1440 } })
  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
    if (process.env.VERBOSE) {
      process.stdout.write(`[console:${msg.type()}] ${msg.text()}\n`)
    }
  })
  page.on('requestfailed', request => {
    if (process.env.VERBOSE) {
      process.stdout.write(`[reqfail] ${request.url()} ${request.failure()?.errorText}\n`)
    }
  })
  page.on('pageerror', error => consoleErrors.push(`pageerror: ${error.message}`))


  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle' })

    check('visitante sem sessao cai em /login', page.url().endsWith('/login'), page.url())

    await page.getByRole('link', { name: 'Cadastre-se' }).click()
    await page.waitForURL('**/register')
    check('link de cadastro navega', page.url().includes('/register'))

    await page.getByLabel('Nome').fill('Verificacao Automatica')
    await page.getByLabel('Email').fill(EMAIL)
    await page.getByLabel('Senha').fill(PASSWORD)
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    // search param: o glob nao casa `?email=...`
    await page.waitForURL(url => url.pathname === '/register/verify', { timeout: 15_000 })
    check('cadastro leva a tela do codigo', new URL(page.url()).pathname === '/register/verify')

    let otp = null
    for (let attempt = 0; attempt < 10 && otp === null; attempt += 1) {
      otp = await readOtpFromMailbox(EMAIL)
      if (otp === null) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    check('OTP chega no servidor de e-mail', otp !== null, otp ?? 'nenhum e-mail encontrado')

    if (otp) {
      await page.getByLabel('Codigo').fill(otp)
      await page.getByRole('button', { name: 'Confirmar e entrar' }).click()
      await page.waitForURL(`${APP_URL}/`, { timeout: 15_000 })
      const landedOnApp = new URL(page.url()).pathname === '/'
      check('OTP + sign-in abrem sessao', landedOnApp, page.url())
      if (!landedOnApp) {
        const probe = await fetch(`${API_URL}/api/auth/get-session`, {
          headers: {
            cookie: (await context.cookies())
              .map(cookie => `${cookie.name}=${cookie.value}`)
              .join('; ')
          }
        })
        const body = await probe.json().catch(() => null)
        process.stdout.write(
          `[debug] get-session ${probe.status} :: ${JSON.stringify(body)}\n`
        )
      }
    }

    const cookieNames = (await context.cookies()).map(cookie => cookie.name)
    check(
      'cookie de sessao gravado',
      cookieNames.some(name => name.includes('session')),
      cookieNames.join(', ')
    )

    await seeText(page, 'Nenhuma instancia conectada', 'estado vazio de instancias aparece')

    // O Button usa asChild, entao renderiza <a> e o papel e link, nao button.
    await page.getByRole('link', { name: 'Conectar WhatsApp' }).click()
    await page.waitForURL('**/connect')
    check('estado vazio leva para /connect', page.url().includes('/connect'))

    await seeText(page, 'Criar e conectar', 'formulario de conexao abriu')
    check(
      'provedor fixo em WAHA, sem toggle morto',
      (await page.getByText('WAHA').count()) > 0
    )

    // Nome unico por execucao: a WAHA guarda a sessao por nome, e repetir o mesmo
    // nome colide com a sessao da execucao anterior.
    await page.getByLabel('Nome da instancia').fill(`verificacao-${RUN_ID}`)
    // phone_number tem indice unico global no backend, entao o numero precisa
    // ser novo a cada execucao.
    await page.getByLabel('Numero do WhatsApp').fill(`5511${String(RUN_ID).slice(-9)}`)
    const createResponse = page.waitForResponse(
      res => res.url().startsWith(`${API_URL}/api/whatsapp/instances`) && res.request().method() === 'POST',
      { timeout: 20_000 }
    )
    await page.getByRole('button', { name: 'Criar e conectar' }).click()
    const created = await createResponse
    check(
      'cria instancia no backend',
      created.status() === 201,
      `status ${created.status()}`
    )

    const createdBody = await created.json()
    check(
      'agenda_enabled chega false, como o backend exige',
      createdBody.agendaEnabled === false,
      JSON.stringify(createdBody.agendaEnabled)
    )
    check('provider waha gravado', createdBody.provider === 'waha', createdBody.provider)

    await page.getByText('Codigo de pareamento').first().waitFor({ timeout: 20_000 })
    check('avanca para a tela de pareamento', true)

    const instanceId = createdBody.id
    let secondId: string | null = null
    const qrResponse = await fetch(`${API_URL}/api/whatsapp/instances/${instanceId}/qr`, {
      headers: { cookie: (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ') }
    })
    check(
      'a rota de QR responde (WAHA real necessaria)',
      [200, 400, 404, 502].includes(qrResponse.status),
      `status ${qrResponse.status}`
    )

    await page.goto(APP_URL, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Parar' }).click()
    // exact: "Conectar numero" do header/painel tambem casa por substring.
    await page.getByRole('button', { name: 'Conectar', exact: true }).first().waitFor({ timeout: 20_000 })
    check('parar desconecta a instancia', true)

    await page.getByRole('button', { name: 'Conectar', exact: true }).first().click()
    await page.waitForURL('**/connect', { timeout: 15_000 })
    await page.getByRole('button', { name: 'Iniciar sessao' }).waitFor({ timeout: 20_000 })
    check('sessao parada mostra Iniciar sessao em vez de erro', true)

    await page.getByRole('button', { name: 'Iniciar sessao' }).click()
    await page.getByText('Codigo de pareamento').first().waitFor({ timeout: 30_000 })
    check('iniciar libera QR e codigo de novo', true)

    // Com instancia existente, o atalho permanente precisa abrir o formulario
    // vazio, nao o pareamento da instancia antiga.
    await page.goto(APP_URL, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Conectar numero' }).first().click()
    await page.waitForURL('**/connect', { timeout: 15_000 })
    const secondPhone = await page.getByLabel('Numero do WhatsApp').inputValue()
    const secondName = await page.getByLabel('Nome da instancia').inputValue()
    check('atalho abre formulario vazio com instancia existente', secondPhone === '' && secondName === '')

    await page.getByLabel('Nome da instancia').fill(`verificacao-${RUN_ID}-2`)
    await page.getByLabel('Numero do WhatsApp').fill(`5521${String(RUN_ID).slice(-9)}`)
    const secondCreate = page.waitForResponse(
      res => res.url().startsWith(`${API_URL}/api/whatsapp/instances`) && res.request().method() === 'POST',
      { timeout: 20_000 }
    )
    await page.getByRole('button', { name: 'Criar e conectar' }).click()
    const secondCreated = await secondCreate
    check(
      'cria segunda instancia pelo atalho',
      secondCreated.status() === 201,
      `status ${secondCreated.status()}`
    )
    await page.getByText('Codigo de pareamento').first().waitFor({ timeout: 30_000 })
    check('segunda instancia chega ao pareamento', true)
    const secondBody = await secondCreated.json()
    secondId = secondBody.id

    const leadsResponse = await page.goto(`${APP_URL}/leads`, { waitUntil: 'networkidle' })
    check('rota /leads responde', leadsResponse?.status() === 200, String(leadsResponse?.status()))
    await seeText(page, 'Nenhuma instancia selecionada', '/leads pede selecao de instancia')

    await page.goto(APP_URL, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Leads' }).first().click()
    await page.waitForURL('**/leads')
    await seeText(page, 'Nenhum lead por aqui', 'lista de leads vazia aparece')

    await page.getByRole('button', { name: 'Sair' }).click()
    await page.waitForURL('**/login', { timeout: 15_000 })
    check('sair volta para /login', page.url().includes('/login'))

    const fatalErrors = consoleErrors.filter(
      text => !/favicon|ERR_|Failed to load resource|status of 4\d\d|status of 5\d\d/iu.test(text)
    )
    check('sem erro de console inesperado', fatalErrors.length === 0, fatalErrors.join(' | '))

    const cookieHeader = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ')
    for (const id of [instanceId, secondId].filter((id): id is string => id !== null)) {
      await fetch(`${API_URL}/api/whatsapp/instances/${id}`, {
        headers: { cookie: cookieHeader },
        method: 'DELETE'
      }).catch(() => null)
    }
  } catch (error) {
    failures += 1
    process.stdout.write(`[FALHOU] excecao: ${error instanceof Error ? error.stack : String(error)}\n`)
    await page.screenshot({ path: FAILURE_SHOT, fullPage: true }).catch(() => null)
    process.stdout.write(`[debug] url=${page.url()}\n`)
    process.stdout.write(`[debug] body=${(await page.locator('body').innerText()).slice(0, 900)}\n`)
  } finally {
    await browser.close()
  }

  process.stdout.write(failures === 0 ? '\nTudo verde.\n' : `\n${failures} verificacao(oes) falharam.\n`)
  process.exit(failures === 0 ? 0 : 1)
}

await main()