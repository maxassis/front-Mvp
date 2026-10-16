import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { AuthCard, AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRequestPasswordReset } from '@/features/auth/mutations'

export const Route = createFileRoute('/forgot-password/')({
  component: ForgotPasswordPage
})

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const requestReset = useRequestPasswordReset()
  const [email, setEmail] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await requestReset.mutateAsync({ email })
      toast.success('Enviamos um codigo de recuperacao para o seu e-mail.')
      await navigate({ to: '/forgot-password/verify', search: { email } })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel enviar o codigo')
    }
  }

  return (
    <AuthShell>
      <AuthCard
        description="Informe seu e-mail para receber um codigo de recuperacao"
        footer={
          <>
            Lembrou a senha?{' '}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/login">
              Entrar
            </Link>
          </>
        }
        title="Recuperar senha"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              autoComplete="email"
              autoFocus
              id="forgot-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <Button className="w-full" disabled={requestReset.isPending} type="submit">
            {requestReset.isPending ? 'Enviando...' : 'Enviar codigo'}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
