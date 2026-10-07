import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingForm } from '@/features/onboarding/components/onboarding-form'
import { OnboardingItemList } from '@/features/onboarding/components/onboarding-item-list'
import { onboardingItemsQuery } from '@/features/onboarding/queries'
import { instancesQuery } from '@/features/instances/queries'
import { useUiStore } from '@/stores/ui-store'

const onboardingSearchSchema = z.object({
  instanceId: z.string().optional()
})

export const Route = createFileRoute('/_authed/onboarding')({
  component: OnboardingPage,
  validateSearch: onboardingSearchSchema
})

function OnboardingPage() {
  // Mesmo arranjo do /leads: instancia pela URL com o Zustand de reserva.
  const searchInstanceId = Route.useSearch({ select: (search) => search.instanceId })
  const selectedInstanceId = useUiStore((state) => state.selectedInstanceId)
  const instanceId = searchInstanceId ?? selectedInstanceId

  const instances = useQuery(instancesQuery)
  const items = useQuery(onboardingItemsQuery(instanceId ?? ''))

  if (!instanceId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Building2 className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Nenhuma instancia selecionada</p>
        <p className="text-sm text-muted-foreground">
          Volte para Conexoes e abra o onboarding de uma instancia
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/">Ver conexoes</Link>
        </Button>
      </div>
    )
  }

  const instance = (instances.data ?? []).find((current) => current.id === instanceId)

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-semibold">Onboarding do chatbot</h1>
        <p className="text-sm text-muted-foreground">
          {instance
            ? `${instance.instanceName ?? instance.providerInstanceId}${instance.phoneNumber ? ` - ${instance.phoneNumber}` : ''}`
            : 'Configure as perguntas que entram no contexto da IA'}
        </p>
      </div>

      {items.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Nao foi possivel carregar o onboarding. {items.error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {instances.isPending || items.isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton className="h-16 w-full" key={index} />
          ))}
        </div>
      ) : instances.isSuccess && !instance ? (
        <p className="text-sm text-muted-foreground">Instancia nao encontrada</p>
      ) : (
        instance && (
          <>
            {instance.agendaEnabled ? (
              <p className="text-sm text-muted-foreground">
                A agenda esta ligada: os campos de agendamento sao obrigatorios e nao podem ser
                desativados.
              </p>
            ) : null}
            <OnboardingForm
              agendaEnabled={instance.agendaEnabled}
              instanceId={instanceId}
              items={items.data ?? []}
            />
            <OnboardingItemList
              agendaEnabled={instance.agendaEnabled}
              instanceId={instanceId}
              items={items.data ?? []}
            />
          </>
        )
      )}
    </div>
  )
}
