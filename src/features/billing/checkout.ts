export const absoluteUrl = (path: string, origin: string = window.location.origin): string =>
  `${origin}${path}`

export const checkoutUrls = (): { cancelUrl: string; successUrl: string } => ({
  cancelUrl: absoluteUrl('/plano?status=cancelado'),
  successUrl: absoluteUrl('/plano?status=sucesso')
})

/**
 * Latch de disparo unico por carregamento de pagina. Vive no modulo para
 * sobreviver ao remount do componente (Back do Stripe, re-entry), que um ref
 * de instancia nao segura.
 */
let checkoutHandoffStarted = false

export const beginCheckoutHandoff = (): boolean => {
  if (checkoutHandoffStarted) {
    return false
  }
  checkoutHandoffStarted = true
  return true
}

/** Libera o latch para o usuario tentar de novo sem recarregar a pagina. */
export const resetCheckoutHandoff = (): void => {
  checkoutHandoffStarted = false
}

const CHECKOUT_SUCCESS_POLL_INTERVAL_MS = 4_000

export const CHECKOUT_SUCCESS_POLL_BUDGET_MS = 30_000

export const checkoutSuccessPollMs = (elapsedMs: number, hasActive: boolean): number | false => {
  if (hasActive) {
    return false
  }

  return elapsedMs < CHECKOUT_SUCCESS_POLL_BUDGET_MS ? CHECKOUT_SUCCESS_POLL_INTERVAL_MS : false
}
