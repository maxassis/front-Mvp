/**
 * A senha precisa atravessar a tela de confirmacao porque o OTP do cadastro so
 * e consumido por `/email-otp/verify-email`, e nao por `/sign-in/email-otp`:
 * os dois leem buckets diferentes de verificacao. Como verificar o e-mail nao
 * abre sessao (o backend nao define `autoSignInAfterVerification`), o sign-in
 * vem logo em seguida e exige a senha de novo.
 *
 * Fica so em memoria: nada vai para o disco, e um reload do navegador limpa.
 */
let pendingPassword: string | null = null

export const setPendingPassword = (password: string): void => {
  pendingPassword = password
}

/** Le e limpa em uma operacao, para a senha nao ficar em memoria apos o uso. */
export const takePendingPassword = (): string | null => {
  const password = pendingPassword
  pendingPassword = null
  return password
}
