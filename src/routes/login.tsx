import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { AuthCard, AuthShell } from '@/components/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSignIn } from '@/features/auth/mutations'
import { sessionQuery } from '@/features/auth/queries'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage
})

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const signIn = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await signIn.mutateAsync({ email, password })
      await queryClient.invalidateQueries({ queryKey: sessionQuery.queryKey })
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
      </AuthCard>
    </AuthShell>
  )
}
