import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { AuthCard, AuthShell } from '@/components/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSignIn, useVerifyEmailOtp } from '@/features/auth/mutations'
import { takePendingPassword } from '@/features/auth/sign-in-credentials'

export const Route = createFileRoute('/register/verify')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : ''
  }),
  component: VerifyEmailPage
})

function VerifyEmailPage() {
  const { email: emailFromSearch } = Route.useSearch()
  const navigate = useNavigate()
  const verify = useVerifyEmailOtp()
  const signIn = useSignIn()
  const [email, setEmail] = useState(emailFromSearch)
  const [otp, setOtp] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const password = takePendingPassword()

    if (!password) {
      toast.error('Volte ao cadastro e repita o passo para informar a senha novamente.')
      return
    }

    try {
      await verify.mutateAsync({ email, otp })
      await signIn.mutateAsync({ email, password })
      await navigate({ to: '/' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel confirmar o codigo')
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
          {emailFromSearch.length === 0 ? (
            <div className="space-y-2">
              <Label htmlFor="verify-email">Email</Label>
              <Input
                autoComplete="email"
                autoFocus
                id="verify-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
          ) : null}

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
