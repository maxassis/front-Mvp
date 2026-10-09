import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { AuthCard, AuthShell } from '@/components/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResendVerificationOtp, useSignIn, useVerifyEmailOtp } from '@/features/auth/mutations'
import {
  clearPendingPassword,
  peekPendingPassword
} from '@/features/auth/sign-in-credentials'
import { parsePlanSearch } from '@/features/billing/plano-search'

export const Route = createFileRoute('/register/verify')({
  validateSearch: (search: Record<string, unknown>) => {
    const { plan } = parsePlanSearch(search)
    return {
      email: typeof search.email === 'string' ? search.email : '',
      ...(plan ? { plan } : {})
    }
  },
  component: VerifyEmailPage
})

function VerifyEmailPage() {
  const { email: emailFromSearch, plan } = Route.useSearch()
  const navigate = useNavigate()
  const verify = useVerifyEmailOtp()
  const signIn = useSignIn()
  const resend = useResendVerificationOtp()
  const [email, setEmail] = useState(emailFromSearch)
  const [otp, setOtp] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const password = peekPendingPassword()

    if (!password) {
      toast.error('Volte ao cadastro e repita o passo para informar a senha novamente.')
      return
    }

    try {
      await verify.mutateAsync({ email, otp })
      await signIn.mutateAsync({ email, password })
      clearPendingPassword()
      if (plan) {
        await navigate({ to: '/checkout', search: { plan } })
      } else {
        await navigate({ to: '/' })
      }
    } catch (error) {
      // A senha fica na memoria de proposito: o OTP aceita 5 tentativas e um
      // codigo errado nao pode trancar a tela. Se o sign-in falhar depois do
      // OTP ja consumido, ai nao ha mais o que tentar.
      if (verify.isIdle && signIn.isError) {
        clearPendingPassword()
        toast.error('Codigo confirmado, mas o login falhou. Entre com a senha na tela de login.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel confirmar o codigo')
      }
    }
  }

  return (
    <AuthShell>
      <AuthCard
        description={`Enviamos um codigo de 6 digitos para ${emailFromSearch || 'o seu e-mail'}`}
        footer={
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/login">
            Voltar para o login
          </Link>
        }
        title="Confirmar e-mail"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="verify-email">Email</Label>
            <Input
              autoComplete="email"
              autoFocus
              disabled={emailFromSearch.length > 0}
              id="verify-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verify-otp">Codigo</Label>
            <Input
              autoFocus={emailFromSearch.length > 0}
              id="verify-otp"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setOtp(event.target.value.replaceAll(/\D/gu, ''))}
              placeholder="000000"
              required
              value={otp}
            />
          </div>

          {verify.isError || signIn.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {(verify.error ?? signIn.error)?.message}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* O OTP vale 10 minutos e nao ha como pedir outro pela API de cadastro,
              entao a unica saida quando ele expira e reenviar por aqui. */}
          <Button
            disabled={resend.isPending || email.trim().length === 0}
            onClick={() => resend.mutate({ email })}
            type="button"
            variant="link"
          >
            {resend.isPending
              ? 'Reenviando...'
              : resend.isSuccess
                ? 'Codigo reenviado. Confira o e-mail.'
                : 'Nao recebeu o codigo? Reenviar'}
          </Button>

          <Button
            className="w-full"
            disabled={verify.isPending || signIn.isPending || otp.length !== 6}
            type="submit"
          >
            {verify.isPending || signIn.isPending ? 'Confirmando...' : 'Confirmar e entrar'}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
