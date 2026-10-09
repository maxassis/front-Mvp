import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { subscriptionsQuery } from '@/features/billing/queries'
import { ConnectForm } from '@/features/connect/components/connect-form'
import { PairingPanel } from '@/features/connect/components/pairing-panel'
import { useUiStore } from '@/stores/ui-store'

export const Route = createFileRoute('/_authed/connect')({
  beforeLoad: async ({ context }) => {
    const active = await context.queryClient
      .ensureQueryData(subscriptionsQuery)
      .catch(() => 'unknown' as const)
    if (active === null) {
      throw redirect({ search: {}, to: '/plano' })
    }
  },
  component: ConnectPage
})

type ConnectPhase = { kind: 'form' } | { instanceId: string; kind: 'pairing' }

const assertNever = (phase: never): never => {
  throw new Error(`Fase desconhecida: ${JSON.stringify(phase)}`)
}

function ConnectPage() {
  const selectedInstanceId = useUiStore((state) => state.selectedInstanceId)
  const [phase, setPhase] = useState<ConnectPhase>(() =>
    selectedInstanceId === null
      ? { kind: 'form' }
      : { instanceId: selectedInstanceId, kind: 'pairing' }
  )

  const handlePaired = useCallback(
    (instanceId: string) => setPhase({ instanceId, kind: 'pairing' }),
    []
  )

  switch (phase.kind) {
    case 'form':
      return <ConnectForm onPaired={handlePaired} />
    case 'pairing':
      return <PairingPanel instanceId={phase.instanceId} />
    default:
      return assertNever(phase)
  }
}
