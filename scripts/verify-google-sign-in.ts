/**
 * Prova a fatia do login com Google num Chromium de verdade contra o app de
 * verdade. Nao faz o round trip no Google, que exige conta humana.
 *
 *   bun scripts/verify-google-sign-in.ts
 */
import { chromium } from 'playwright'

const APP_URL = process.env.APP_URL ?? 'http://localhost:4174'

let failures = 0
const check = (label: string, ok: boolean, detail = ''): void => {
  if (!ok) {
    failures += 1
  }
  process.stdout.write(`[${ok ? 'PASS' : 'FALHOU'}] ${label}${detail ? ` :: ${detail}` : ''}\n`)
}

const googleButton = (page: import('playwright').Page) =>
  page.getByRole('button', { name: 'Entrar com Google', exact: true })

const main = async (): Promise<void> => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const consoleErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle' })

  const loginCount = await googleButton(page).count()
  check('login oferece Entrar com Google', loginCount === 1, `achou ${loginCount}`)

  await page.goto(`${APP_URL}/register`, { waitUntil: 'networkidle' })
  await page.getByLabel('Nome').waitFor({ state: 'visible', timeout: 15_000 })
  const registerCount = await googleButton(page).count()
  check('register oferece Entrar com Google', registerCount === 1, `achou ${registerCount}`)

  await page.goto(`${APP_URL}/register/verify`, { waitUntil: 'networkidle' })
  await page.getByLabel('Codigo').waitFor({ state: 'visible', timeout: 15_000 })
  const verifyCount = await googleButton(page).count()
  check('tela do codigo nao oferece Entrar com Google', verifyCount === 0, `achou ${verifyCount}`)

  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle' })
  await page.route('**/api/auth/sign-in/social', route => {
    const origin = route.request().headers().origin ?? APP_URL
    return route.fulfill({
      status: 404,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': origin,
        'content-type': 'application/json'
      },
      json: { code: 'PROVIDER_NOT_FOUND', message: 'Provider not found' }
    })
  })
  await googleButton(page).click()
  await page
    .getByText('Login com Google nao esta configurado neste ambiente.')
    .waitFor({ state: 'visible', timeout: 10_000 })
    .catch(() => null)
  const providerMessage = await page
    .getByText('Login com Google nao esta configurado neste ambiente.')
    .isVisible()
  check('provedor desligado mostra a mensagem traduzida', providerMessage)
  check('botao volta a ficar habilitado depois do erro', await googleButton(page).isEnabled())
  await page.unroute('**/api/auth/sign-in/social')

  const requests: string[] = []
  page.on('request', request => {
    if (request.url().includes('/api/auth/sign-in/social')) {
      requests.push(request.postData() ?? '')
    }
  })
  await googleButton(page).click()
  await page.waitForURL(/accounts\.google\.com/u, { timeout: 15_000 }).catch(() => null)
  check('botao leva para o consentimento do Google', page.url().includes('accounts.google.com'), page.url())
  const payload = requests[0] ?? ''
  check(
    'o POST manda callbackURL absoluto da origem do app',
    payload.includes(`"callbackURL":"${APP_URL}/"`),
    payload
  )
  check(
    'o POST manda errorCallbackURL absoluto',
    payload.includes(`"errorCallbackURL":"${APP_URL}/login"`),
    payload
  )

  await page.goto(`${APP_URL}/login?error=account_not_linked`, { waitUntil: 'networkidle' })
  const callbackMessage = await page
    .getByText('Este e-mail ja tem conta criada com senha e o Google nao esta vinculado.', { exact: false })
    .isVisible()
    .catch(() => false)
  check('erro de callback mostra a mensagem traduzida', callbackMessage)

  const fatalErrors = consoleErrors.filter(
    text => !/favicon|ERR_|Failed to load resource|status of 4\d\d|status of 5\d\d/iu.test(text)
  )
  check('sem erro de console inesperado', fatalErrors.length === 0, fatalErrors.join(' | '))

  await browser.close()
  process.stdout.write(failures === 0 ? '\nOK\n' : `\n${failures} falha(s)\n`)
  process.exit(failures === 0 ? 0 : 1)
}

void main()