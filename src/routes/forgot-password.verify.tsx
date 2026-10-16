import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { AuthCard, AuthShell } from '@/components/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRequestPasswordReset, useResetPassword } from '@/features/auth/mutations'
import { validatePasswordResetSearch } from '@/features/auth/password-reset-search'

export const Route = createFileRoute('/forgot-password/verify')({
  validateSearch: validatePasswordResetSearch,
  component: ResetPasswordPage
})

function ResetPasswordPage() {
  const { email: emailFromSearch } = Route.useSearch()
  const navigate = useNavigate()
  const reset = useResetPassword()
  const resend = useRequestPasswordReset()
  const [email, setEmail] = useState(emailFromSearch)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    reset.mutate(
      { email, otp, password },
      {
        onSuccess: async () => {
          toast.success('Senha alterada. Entre com a nova senha.')
          await navigate({ to: '/login' })
        }
      }
    )
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
        title="Definir nova senha"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              autoComplete="email"
              autoFocus
              disabled={emailFromSearch.length > 0}
              id="reset-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-otp">Codigo</Label>
            <Input
              autoFocus={emailFromSearch.length > 0}
              id="reset-otp"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setOtp(event.target.value.replaceAll(/\D/gu, ''))}
              placeholder="000000"
              required
              value={otp}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password">Nova senha</Label>
            <Input
              autoComplete="new-password"
              id="reset-password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {reset.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{reset.error.message}</AlertDescription>
            </Alert>
          ) : null}

          {/* O codigo de recuperacao expira; sem endpoint proprio de reenvio, a
              unica saida e pedir outro pela request-password-reset. */}
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
            disabled={reset.isPending || otp.length !== 6 || password.length < 8}
            type="submit"
          >
            {reset.isPending ? 'Salvando...' : 'Alterar senha'}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
