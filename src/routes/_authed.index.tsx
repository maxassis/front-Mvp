import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { subscriptionsQuery } from '@/features/billing/queries'
import { demoUsageQuery } from '@/features/demo/queries'
import { InstanceCard } from '@/features/instances/components/instance-card'
import { instancesQuery } from '@/features/instances/queries'

export const Route = createFileRoute('/_authed/')({ component: InstancesPage })

function InstancesPage() {
  const instances = useQuery(instancesQuery)
  const subscriptions = useQuery(subscriptionsQuery)
  const demoUsage = useQuery(demoUsageQuery)
  const list = instances.data ?? []

  // O teste so interessa a quem ainda nao assina. Pendente ou erro esconde o
  // botao: sem a resposta, nao da para afirmar que a pessoa nao tem plano.
  const showDemo = subscriptions.isSuccess && subscriptions.data === null

  // Sem a resposta de uso nao da para afirmar que ainda resta um teste, entao
  // pendente/erro nao mostra botao nenhum.
  const demoAvailable = showDemo && demoUsage.isSuccess && demoUsage.data.remaining > 0
  const demoExhausted = showDemo && demoUsage.isSuccess && demoUsage.data.remaining === 0

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 overflow-y-auto p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Conexoes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas conexoes de WhatsApp em um so lugar
          </p>
        </div>

        {demoAvailable ? (
          <Button asChild variant="outline">
            <Link to="/demo">Testar atendimento</Link>
          </Button>
        ) : demoExhausted ? (
          <Button asChild>
            <Link to="/plano">Escolher plano</Link>
          </Button>
        ) : null}
      </div>

      {instances.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton className="h-48 w-full" key={index} />
          ))}
        </div>
      ) : !instances.isError && list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((instance) => (
            <InstanceCard instance={instance} key={instance.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="items-center py-12 text-center">
      <CardContent className="flex flex-col items-center gap-3">
        <Smartphone className="size-10 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">Nenhuma instancia conectada</p>
          <p className="text-sm text-muted-foreground">
            Conecte um numero de WhatsApp para comecar a receber mensagens
          </p>
        </div>
        <Button asChild>
          <Link to="/connect">
            <Plus /> Conectar WhatsApp
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
