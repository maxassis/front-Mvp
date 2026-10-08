import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { AlertCircle, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSignOut } from '@/features/auth/mutations'
import { sessionKeys, sessionQuery } from '@/features/auth/queries'
import { instancesQuery } from '@/features/instances/queries'
import { useUiStore } from '@/stores/ui-store'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { user: session.user }
  },
  component: AuthedLayout
})

function AuthedLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const signOut = useSignOut()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const { user } = Route.useRouteContext()
  const instances = useQuery(instancesQuery)
  const selectInstance = useUiStore((state) => state.selectInstance)

  // A rota /connect abre o formulario de numero novo so quando nenhuma
  // instancia esta selecionada, entao o atalho precisa limpar antes de navegar.
  const handleConnectNew = () => {
    selectInstance(null)
    void router.navigate({ to: '/connect' })
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut.mutateAsync()
      await router.navigate({ to: '/login' })
      queryClient.clear()
    } catch {
      // Sessao morta e cookie residual: zera o cache local para o guard nao
      // devolver a sessao velha e travar o usuario nesta tela.
      queryClient.setQueryData(sessionKeys.all, null)
      await router.navigate({ to: '/login' })
      queryClient.clear()
      toast.error('Nao foi possivel encerrar a sessao no servidor, mas voce saiu localmente.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.email}</p>
        </div>

        <Button onClick={handleConnectNew} size="sm" type="button">
          <Plus /> Conectar numero
        </Button>

        <Button disabled={isSigningOut} onClick={handleSignOut} size="sm" variant="outline">
          Sair
        </Button>
      </header>

      {instances.isError ? (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              Nao foi possivel carregar suas instancias. {instances.error.message}
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
