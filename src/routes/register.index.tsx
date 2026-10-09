import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { AuthCard, AuthShell } from '@/components/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleSignIn } from '@/features/auth/components/google-sign-in'
import { useSignUp } from '@/features/auth/mutations'
import { setPendingPassword } from '@/features/auth/sign-in-credentials'
import { parsePlanSearch } from '@/features/billing/plano-search'

export const Route = createFileRoute('/register/')({
  component: RegisterPage,
  validateSearch: (search: Record<string, unknown>) => {
    // Chave omitida quando ausente: devolver `plan: undefined` faria o
    // Transitioner reescrever a URL com `?plan=undefined` no mount.
    const { plan } = parsePlanSearch(search)
    return plan ? { plan } : {}
  }
})

function RegisterPage() {
  const { plan } = Route.useSearch()
  const navigate = useNavigate()
  const signUp = useSignUp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await signUp.mutateAsync({ email, name, password })
      setPendingPassword(password)
      await navigate({
        to: '/register/verify',
        search: { email, ...(plan ? { plan } : {}) }
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao cadastrar')
    }
  }

  return (
    <AuthShell>
      <AuthCard
        description="Cadastre-se para gerenciar seus chatbots"
        footer={
          <>
            Ja tem conta?{' '}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/login">
              Entrar
            </Link>
          </>
        }
        title="Criar conta"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="register-name">Nome</Label>
            <Input
              autoComplete="name"
              autoFocus
              id="register-name"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              autoComplete="email"
              id="register-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Senha</Label>
            <Input
              autoComplete="new-password"
              id="register-password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {signUp.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{signUp.error.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button className="w-full" disabled={signUp.isPending} type="submit">
            {signUp.isPending ? 'Criando...' : 'Cadastrar'}
          </Button>
        </form>

        <GoogleSignIn plan={plan} />
      </AuthCard>
    </AuthShell>
  )
}
