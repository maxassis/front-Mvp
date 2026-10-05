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

export const useSignOut = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut()
      // Zera antes de navegar para o guard nao ler uma sessao morta do cache.
      queryClient.setQueryData(sessionKeys.all, null)
      await queryClient.invalidateQueries()
    }
  })
}
