/**
 * Verifica a tela de leads com dados reais: um usuario com instancia, lead e
 * mensagens semeados. Entra por login direto (o e-mail ja foi verificado no
 * cadastro) e confere lista, conversa, ciclo de vida e envio.
 *
 *   bun scripts/verify-leads.ts <email> <senha>
 */
import { chromium } from 'playwright'

const APP_URL = process.env.APP_URL ?? 'http://localhost:4174'
const [EMAIL, PASSWORD] = process.argv.slice(2)

if (!EMAIL || !PASSWORD) {
  process.stderr.write('uso: bun scripts/verify-leads.ts <email> <senha>\n')
  process.exit(1)
}

let failures = 0
const check = (label, ok, detail = '') => {
  if (!ok) {
    failures += 1
  }
  process.stdout.write(`[${ok ? 'PASS' : 'FALHOU'}] ${label}${detail ? ` :: ${detail}` : ''}\n`)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { height: 900, width: 1440 } })
const page = await context.newPage()

try {
  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle' })
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Senha').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL(`${APP_URL}/`, { timeout: 15_000 })

  await page.getByRole('button', { name: 'Leads' }).first().click()
  await page.waitForURL('**/leads', { timeout: 15_000 })

  await page.getByText('Maria Souza').first().waitFor({ timeout: 15_000 })
  check('lead semeado aparece na lista', true)

  const listText = await page.locator('section[aria-label="Leads"]').innerText()
  check('card nao expoe telefone', !listText.includes('+55 (11) 99000-0001'), listText.slice(0, 200))
  check('intake do LLM aparece', listText.includes('Corte de cabelo'))
  check('status pendente rotulado', listText.includes('Pendente'))

  await page.getByText('Maria Souza').first().click()
  await page.getByText('Ola, voces abrem sabado?').waitFor({ timeout: 15_000 })
  check('conversa carrega a mensagem antiga', true)
  const conversationText = await page.locator('section[aria-label="Conversa"]').innerText()
  check('telefone formatado em pt-BR no cabecalho', conversationText.includes('+55 (11) 99000-0001'), conversationText.slice(0, 200))
  check(
    'ultima mensagem do cliente aparece',
    await page.getByText('Quero cortar o cabelo as 14h.').isVisible()
  )

  const bubbles = await page.locator('.whitespace-pre-wrap').count()
  check('tres balhas de mensagem', bubbles === 3, `achou ${bubbles}`)

  const composerVisible = await page
    .getByPlaceholder('Digite para responder...')
    .isVisible()
    .catch(() => false)
  check('lead pendente nao tem composer', composerVisible === false)
  check(
    'lead pendente explica que o bot ainda responde',
    await page.getByText(/bot continua atendendo/u).isVisible()
  )

  await page.getByRole('button', { name: 'Assumir' }).click()
  await page
    .getByPlaceholder('Digite para responder...')
    .waitFor({ state: 'visible', timeout: 15_000 })
  check('assumir revela o composer', true)
  check('lead agora aparece em atendimento', await page.getByText('Em atendimento').first().isVisible())

  check(
    'sem polling automatico de leads',
    await page.getByRole('button', { name: 'Atualizar conversa' }).isVisible()
  )

  check(
    'composer bloqueia envio vazio',
    await page.getByRole('button', { name: 'Enviar' }).isDisabled()
  )

  process.stdout.write(
    failures === 0 ? '\nTudo verde.\n' : `\n${failures} verificacao(oes) falharam.\n`
  )
} catch (error) {
  failures += 1
  process.stdout.write(`[FALHOU] ${error instanceof Error ? error.stack : String(error)}\n`)
  await page.screenshot({ path: '/tmp/bondschat-leads-falha.png', fullPage: true }).catch(() => null)
} finally {
  await browser.close()
}

process.exit(failures === 0 ? 0 : 1)