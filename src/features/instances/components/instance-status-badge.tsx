import type { ComponentProps } from 'react'

import type { InstanceStatus } from '@/api/types'
import { Badge } from '@/components/ui/badge'

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>

interface InstanceStatusPresentation {
  label: string
  variant: BadgeVariant
}

/**
 * Apresentacao unica do status da instancia. A tela le daqui em vez de espalhar
 * um segundo dicionario de rotulos pelos componentes.
 */
const INSTANCE_STATUS_PRESENTATION = {
  connected: { label: 'Conectado', variant: 'default' },
  disconnected: { label: 'Desconectado', variant: 'outline' },
  error: { label: 'Erro', variant: 'destructive' },
  pending: { label: 'Pendente', variant: 'secondary' }
} as const satisfies Record<InstanceStatus, InstanceStatusPresentation>

interface InstanceStatusBadgeProps {
  status: InstanceStatus
}

export function InstanceStatusBadge({ status }: InstanceStatusBadgeProps) {
  const presentation = INSTANCE_STATUS_PRESENTATION[status]

  return <Badge variant={presentation.variant}>{presentation.label}</Badge>
}
