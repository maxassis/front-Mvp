/**
 * A senha precisa atravessar a tela de confirmacao porque o OTP do cadastro so
 * e consumido por `/email-otp/verify-email`, e nao por `/sign-in/email-otp`:
 * os dois leem buckets diferentes de verificacao. Como verificar o e-mail nao
 * abre sessao (o backend nao define `autoSignInAfterVerification`), o sign-in
 * vem logo em seguida e exige a senha de novo.
 *
 * Fica so em memoria: nada vai para o disco, e um reload do navegador limpa.
 *
 * Ler nao consome. O OTP tem 5 tentativas e 10 minutos de validade, entao um
 * codigo digitado errado nao pode destruir a senha e deixar a tela sem para
 * onde ir. O consumo acontece no `clearPendingPassword`, depois do sign-in.
 */
let pendingPassword: string | null = null

export const setPendingPassword = (password: string): void => {
  pendingPassword = password
}

export const peekPendingPassword = (): string | null => pendingPassword

export const clearPendingPassword = (): void => {
  pendingPassword = null
}