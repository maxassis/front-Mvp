/**
 * Prova a recuperacao de senha num Chromium de verdade contra o app de verdade.
 * Cobre rota, chamada real ao endpoint de OTP e validacao do passo de confirmacao.
 *
 * Nao fecha o ciclo do OTP: o codigo chega por e-mail pelo Resend, e o script
 * nao tem caixa de entrada. A digitacao do codigo fica como conferencia manual.
 *
 *   bun scripts/verify-password-reset.ts
 */
import { chromium } from 'playwright'

const APP_URL = process.env.APP_URL ?? 'http://localhost:4174'
const SHOT_DIR = process.env.SHOT_DIR ?? '/tmp/opencode'

let failures = 0
const check = (label: string, ok: boolean, detail = ''): void => {
  if (!ok) {
    failures += 1
  }
  process.stdout.write(`[${ok ? 'PASS' : 'FALHOU'}] ${label}${detail ? ` :: ${detail}` : ''}\n`)
}

const main = async (): Promise<void> => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const consoleErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  let resetStatus = 0
  page.on('response', response => {
    if (response.url().includes('/api/auth/email-otp/request-password-reset')) {
      resetStatus = response.status()
    }
  })

  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle' })
  const forgotLink = page.getByRole('link', { name: 'Esqueceu a senha?', exact: true })
  check('login oferece o link de recuperacao', (await forgotLink.count()) === 1)

  await forgotLink.click()
  await page.waitForURL(/\/forgot-password$/u, { timeout: 15_000 }).catch(() => null)
  await page.getByRole('heading', { name: 'Recuperar senha' }).waitFor({ state: 'visible', timeout: 15_000 })
  check('link leva para /forgot-password', new URL(page.url()).pathname === '/forgot-password', page.url())
  await page.screenshot({ path: `${SHOT_DIR}/password-reset-1-request.png` })

  await page.getByLabel('Email').fill('reset-verify@example.com')
  await page.getByRole('button', { name: 'Enviar codigo' }).click()
  await page.waitForURL(/\/forgot-password\/verify/u, { timeout: 15_000 }).catch(() => null)
  await page
    .getByRole('heading', { name: 'Definir nova senha' })
    .waitFor({ state: 'visible', timeout: 15_000 })
    .catch(() => null)
  check(
    'pedido de codigo navega para o passo de confirmacao',
    page.url().includes('/forgot-password/verify'),
    page.url()
  )
  check('endpoint de OTP respondeu 200', resetStatus === 200, `status ${resetStatus}`)
  check('o email viaja na URL e o campo chega preenchido', page.url().includes('email=reset-verify%40example.com'))

  const emailField = page.getByLabel('Email')
  check('campo de email chega travado quando vem da URL', await emailField.isDisabled())
  check('campo de email carrega o valor pedido', (await emailField.inputValue()) === 'reset-verify@example.com')

  const submit = page.getByRole('button', { name: 'Alterar senha' })
  check('submit bloqueado sem codigo nem senha', await submit.isDisabled())

  await page.getByLabel('Codigo').fill('123456')
  check('submit ainda bloqueado sem senha', await submit.isDisabled())

  await page.getByLabel('Nova senha').fill('senha-nova-123')
  check('submit libera com codigo de 6 e senha de 8', await submit.isEnabled())
  await page.screenshot({ path: `${SHOT_DIR}/password-reset-2-confirm.png` })

  await page.getByLabel('Codigo').fill('12')
  check('submit volta a bloquear com codigo curto', await submit.isDisabled())

  const fatalErrors = consoleErrors.filter(
    text => !/favicon|ERR_|Failed to load resource|status of 4\d\d|status of 5\d\d/iu.test(text)
  )
  check('sem erro de console inesperado', fatalErrors.length === 0, fatalErrors.join(' | '))

  await browser.close()
  process.stdout.write(failures === 0 ? '\nOK\n' : `\n${failures} falha(s)\n`)
  process.exit(failures === 0 ? 0 : 1)
}

void main()
