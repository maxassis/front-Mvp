import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authClient } from '@/lib/auth-client'
import { sessionKeys } from './queries'

const INVALID_CREDENTIAL_MESSAGE =
  'Email ou senha invalidos. Se a conta ainda nao foi verificada, confirme o codigo de 6 digitos.'

export interface SignInInput {
  email: string
  password: string
}

export const useSignIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SignInInput) => {
      const { data, error } = await authClient.signIn.email({
        email: input.email,
        password: input.password
      })

      if (error || !data) {
        throw new Error(
          error?.code === 'EMAIL_NOT_VERIFIED'
            ? 'Confirme o codigo de verificacao enviado para o seu e-mail antes de entrar.'
            : (error?.message ?? INVALID_CREDENTIAL_MESSAGE)
        )
      }

      // Invalidate nao serve aqui: o guard de rota le a sessao por
      // `ensureQueryData`, que devolve o cache ainda nulo e joga para /login.
      // E preciso gravar o valor novo, nao marcar como velho.
      const { data: session } = await authClient.getSession()
      queryClient.setQueryData(sessionKeys.all, session ?? null)
      return data
    }
  })
}

const GOOGLE_ERROR_MESSAGE: Record<string, string> = {
  INVALID_CALLBACK_URL:
    'O servidor recusou a URL de retorno do login. Tente de novo a partir da tela de entrada.',
  INVALID_ORIGIN:
    'O servidor recusou a origem desta pagina. Tente de novo a partir da tela de entrada.',
  PROVIDER_NOT_FOUND: 'Login com Google nao esta configurado neste ambiente.'
}

const GOOGLE_ERROR_FALLBACK =
  'Nao foi possivel iniciar a entrada com Google. Tente de novo.'

export const useSignInWithGoogle = () =>
  useMutation({
    mutationFn: async ({ plan }: { plan?: string } = {}): Promise<void> => {
      const origin = window.location.origin
      const { data, error } = await authClient.signIn.social({
        callbackURL: `${origin}/`,
        errorCallbackURL: `${origin}/login`,
        // Usuario novo cai no checkout com plano ou na tela de planos sem
        // plano; quem ja tem conta mantem o callbackURL e volta para `/`.
        newUserCallbackURL: plan
          ? `${origin}/checkout?plan=${encodeURIComponent(plan)}`
          : `${origin}/plano`,
        provider: 'google'
      })

      if (error) {
        const mapped = error.code ? GOOGLE_ERROR_MESSAGE[error.code] : undefined
        throw new Error(mapped ?? GOOGLE_ERROR_FALLBACK)
      }

      if (!data?.url) {
        throw new Error(GOOGLE_ERROR_FALLBACK)
      }

      // Ao contrario do useSignIn acima, nao ha getSession + setQueryData: o
      // hand-off social tira a pagina inteira daqui pelo redirect padrao do
      // better-auth, entao nao existe cache a preencher e o guard de rota rele
      // a sessao quando o usuario volta.
    }
  })

export interface SignUpInput extends SignInInput {
  name: string
}

/**
 * O backend roda com `requireEmailVerification`, entao o cadastro devolve
 * `token: null` e nenhuma sessao. Quem cria a sessao e o sign-in seguinte, no
 * passo apos confirmar o OTP.
 */
export const useSignUp = () =>
  useMutation({
    mutationFn: async (input: SignUpInput) => {
      const { error } = await authClient.signUp.email({
        email: input.email,
        name: input.name,
        password: input.password
      })

      if (error) {
        throw new Error(error.message ?? 'Nao foi possivel criar a conta')
      }
    }
  })

export const useVerifyEmailOtp = () =>
  useMutation({
    mutationFn: async (input: { email: string; otp: string }) => {
      const { data, error } = await authClient.emailOtp.verifyEmail({
        email: input.email,
        otp: input.otp
      })

      if (error || !data) {
        throw new Error(error?.message ?? 'Codigo invalido ou expirado')
      }

      return data
    }
  })

export const useResendVerificationOtp = () =>
  useMutation({
    mutationFn: async (input: { email: string }) => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: input.email,
        type: 'email-verification'
      })

      if (error) {
        throw new Error(error.message ?? 'Nao foi possivel reenviar o codigo')
      }
    }
  })

export const useSignOut = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut()
      // Zera antes de navegar para o guard nao ler uma sessao morta do cache.
      // O descarte do restante do cache fica para a rota, apos o _authed
      // desmontar: invalidar/limpar aqui refaria o fetch de queries ainda
      // observadas, batendo na API sem cookie.
      queryClient.setQueryData(sessionKeys.all, null)
    }
  })
}
