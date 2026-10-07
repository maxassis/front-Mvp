import { createFileRoute, redirect } from '@tanstack/react-router'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { AuthCard, AuthShell } from '@/components/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleSignIn } from '@/features/auth/components/google-sign-in'
import { useSignIn } from '@/features/auth/mutations'
import { sessionQuery } from '@/features/auth/queries'

const CALLBACK_ERROR_MESSAGE: Record<string, string> = {
  PROVIDER_NOT_FOUND: 'Login com Google nao esta configurado neste ambiente.',
  account_not_linked:
    'Este e-mail ja tem conta criada com senha e o Google nao esta vinculado. Entre com e-mail e senha.',
  invalid_code: 'O Google devolveu um codigo de acesso invalido. Tente entrar de novo.',
  state_invalid: 'A tentativa de login com Google expirou. Tente entrar de novo.',
  state_mismatch: 'A tentativa de login com Google nao confere. Tente entrar de novo.',
  state_security_mismatch: 'A tentativa de login com Google nao confere. Tente entrar de novo.'
}

const CALLBACK_ERROR_FALLBACK =
  'Nao foi possivel completar a entrada com Google. Tente de novo.'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { error?: string | null } => ({
    error: typeof search.error === 'string' ? search.error : null
  }),
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage
})

function LoginPage() {
  const { error: callbackError } = Route.useSearch()
  const navigate = useNavigate()
  const signIn = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await signIn.mutateAsync({ email, password })
      await navigate({ to: '/' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao entrar')
    }
  }

  return (
    <AuthShell>
      <AuthCard
        description="Acesse o painel de atendimento"
        footer={
          <>
            Nao tem conta?{' '}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/register">
              Cadastre-se
            </Link>
          </>
        }
        title="Entrar"
      >
        {callbackError ? (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>
              {CALLBACK_ERROR_MESSAGE[callbackError] ?? CALLBACK_ERROR_FALLBACK}
            </AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              autoComplete="email"
              autoFocus
              id="login-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <Input
              autoComplete="current-password"
              id="login-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {signIn.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{signIn.error.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button className="w-full" disabled={signIn.isPending} type="submit">
            {signIn.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <GoogleSignIn />
      </AuthCard>
    </AuthShell>
  )
}
