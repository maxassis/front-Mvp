/**
 * Verifica a tela de banco de provas: usuario real, instancia real e resposta
 * do bot de verdade. O LLM responde de verdade, entao o resultado nunca e
 * fixado na mao: o script afirma a resposta vira, em gomos e em turnos.
 *
 *   bun scripts/verify-playground.ts <email> <senha>
 */
import { chromium } from 'playwright'

const APP_URL = process.env.APP_URL ?? 'http://localhost:4174'
const [EMAIL, PASSWORD] = process.argv.slice(2)

if (!EMAIL || !PASSWORD) {
  process.stderr.write('uso: bun scripts/verify-playground.ts <email> <senha>\n')
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

  const cardHasTestButton = await page
    .getByRole('button', { name: /Testar/u })
    .first()
    .isVisible()
    .catch(() => false)
  check('cartao da instancia tem botao Testar', cardHasTestButton)
  if (!cardHasTestButton) {
    process.stdout.write(
      'usuario sem instancia conectada; conecte uma antes de verificar o teste do bot\n'
    )
    process.exit(1)
  }

  await page.getByRole('button', { name: /Testar/u }).first().click()
  await page.waitForURL('**/playground', { timeout: 15_000 })
  check('rota de teste abre', await page.getByText('Testar bot').first().isVisible())
  check(
    'aviso de simulacao sem envio ao WhatsApp',
    await page.getByText(/nada e enviado ao WhatsApp/u).isVisible()
  )
  check(
    'estado vazio pede a primeira pergunta',
    await page.getByText('Faca uma pergunta para o bot').isVisible()
  )

  const composer = page.getByLabel('Pergunta para o bot')
  await composer.fill('Ola, qual o cardapio?')
  await page.getByRole('button', { name: 'Enviar pergunta' }).click()

  await page.getByText('Ola, qual o cardapio?').waitFor({ timeout: 60_000 })
  check('pergunta do testador aparece como gomo', true)
  const firstTurnBubbles = await page.locator('.whitespace-pre-wrap').count()
  check('bot respondeu o primeiro turno em gomos', firstTurnBubbles >= 2, `achou ${firstTurnBubbles}`)

  await composer.fill('E segunda-feira?')
  await page.getByRole('button', { name: 'Enviar pergunta' }).click()
  await page.getByText('E segunda-feira?').waitFor({ timeout: 60_000 })
  const secondTurnBubbles = await page.locator('.whitespace-pre-wrap').count()
  check('segundo turno entra na mesma conversa', secondTurnBubbles > firstTurnBubbles, `foi ${firstTurnBubbles} para ${secondTurnBubbles}`)

  await page.getByRole('button', { name: 'Nova conversa' }).click()
  check(
    'nova conversa volta ao estado vazio',
    await page.getByText('Faca uma pergunta para o bot').isVisible()
  )

  process.stdout.write(
    failures === 0 ? '\nTudo verde.\n' : `\n${failures} verificacao(oes) falharam.\n`
  )
} catch (error) {
  failures += 1
  process.stdout.write(`[FALHOU] ${error instanceof Error ? error.stack : String(error)}\n`)
  await page
    .screenshot({ path: '/tmp/bondschat-playground-falha.png', fullPage: true })
    .catch(() => null)
} finally {
  await browser.close()
}

process.exit(failures === 0 ? 0 : 1)
