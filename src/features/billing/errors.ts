/**
 * Codigos de erro do plugin Stripe do Better Auth traduzidos para o usuario.
 * Codigo desconhecido cai no fallback; a mensagem crua do servidor costuma vir
 * em ingles e nao e confiavel para exibir.
 */
export const BILLING_ERROR_MESSAGE: Record<string, string> = {
  EMAIL_VERIFICATION_REQUIRED: 'Confirme seu e-mail antes de assinar.',
  INVALID_CALLBACK_URL: 'O servidor recusou a URL de retorno da assinatura. Tente de novo.',
  INVALID_ORIGIN: 'O servidor recusou a origem desta pagina. Tente de novo.',
  SUBSCRIPTION_PLAN_NOT_FOUND: 'Este plano nao esta disponivel agora. Atualize a pagina e tente de novo.'
}

export const BILLING_ERROR_FALLBACK = 'Nao foi possivel iniciar a assinatura. Tente de novo.'

export const billingError = (error: { code?: string; message?: string }): Error =>
  new Error((error.code ? BILLING_ERROR_MESSAGE[error.code] : undefined) ?? BILLING_ERROR_FALLBACK)
