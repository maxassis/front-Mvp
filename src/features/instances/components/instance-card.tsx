import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MessageSquare, Tag } from 'lucide-react'

import type { WhatsappInstance, WhatsappProvider } from '@/api/types'
import { BUSINESS_TYPE_LABELS } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { BusinessTypeDialog } from '@/features/instances/components/business-type-dialog'
import { InstanceStatusBadge } from '@/features/instances/components/instance-status-badge'
import { RemoveInstanceDialog } from '@/features/instances/components/remove-instance-dialog'
import { useStopInstance, useToggleChatbot } from '@/features/instances/mutations'
import { useUiStore } from '@/stores/ui-store'

const PROVIDER_LABEL = {
  waha: 'WAHA',
  whatsapp_cloud_api: 'WhatsApp Cloud API'
} as const satisfies Record<WhatsappProvider, string>

interface InstanceCardProps {
  instance: WhatsappInstance
}

export function InstanceCard({ instance }: InstanceCardProps) {
  const navigate = useNavigate()
  const selectInstance = useUiStore((state) => state.selectInstance)
  const toggleChatbot = useToggleChatbot(instance.id)
  const stop = useStopInstance(instance.id)
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false)

  const displayName = instance.instanceName ?? instance.phoneNumber
  // Texto livre tem prioridade; sem ele, cai no rotulo da categoria.
  const segmentLabel =
    instance.businessTypeLabel ??
    (instance.businessType ? BUSINESS_TYPE_LABELS[instance.businessType] : null)

  const handleOpenLeads = () => {
    selectInstance(instance.id)
    void navigate({ search: { instanceId: instance.id }, to: '/leads' })
  }

  const handleOpenOnboarding = () => {
    selectInstance(instance.id)
    void navigate({ search: { instanceId: instance.id }, to: '/onboarding' })
  }

  const handleOpenFiles = () => {
    selectInstance(instance.id)
    void navigate({ search: { instanceId: instance.id }, to: '/files' })
  }

  // Sem segmento o backend recusa ligar o chatbot; abre o dialog em vez de ligar.
  const handleToggleChatbot = (enabled: boolean) => {
    if (enabled && !instance.businessType) {
      setBusinessDialogOpen(true)
      return
    }
    toggleChatbot.mutate(enabled)
  }

  // `/connect` decide entre o formulario e o QR a partir da instancia
  // selecionada, entao conectar tem que selecionar antes de navegar.
  const handleConnect = () => {
    selectInstance(instance.id)
    void navigate({ to: '/connect' })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="min-w-0 truncate">{displayName}</CardTitle>
          <CardDescription>{instance.phoneNumber}</CardDescription>
          <CardAction>
            <InstanceStatusBadge status={instance.status} />
          </CardAction>
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{PROVIDER_LABEL[instance.provider]}</Badge>
            {segmentLabel ? <Badge variant="secondary">{segmentLabel}</Badge> : null}
          </div>

          <label
            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
            htmlFor={`chatbot-${instance.id}`}
          >
            Chatbot
            <Switch
              aria-label={`Ativar chatbot de ${displayName}`}
              checked={instance.chatbotEnabled}
              disabled={toggleChatbot.isPending}
              id={`chatbot-${instance.id}`}
              onCheckedChange={handleToggleChatbot}
            />
          </label>
        </CardContent>

        <CardFooter className="flex-wrap gap-2">
          {instance.status === 'connected' ? null : (
            <Button onClick={handleConnect} size="sm" type="button" variant="outline">
              Conectar
            </Button>
          )}
          <Button onClick={handleOpenLeads} size="sm" type="button" variant="outline">
            <MessageSquare /> Leads
          </Button>
          <Button onClick={handleOpenOnboarding} size="sm" type="button" variant="outline">
            Onboarding
          </Button>
          <Button onClick={handleOpenFiles} size="sm" type="button" variant="outline">
            Arquivos
          </Button>
          {instance.provider === 'waha' && instance.status !== 'disconnected' ? (
            <Button
              disabled={stop.isPending}
              onClick={() => stop.mutate()}
              size="sm"
              type="button"
              variant="outline"
            >
              {stop.isPending ? 'Parando...' : 'Parar'}
            </Button>
          ) : null}
          <Button
            onClick={() => setBusinessDialogOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Tag /> Segmento
          </Button>
          <RemoveInstanceDialog instance={instance} />
        </CardFooter>
      </Card>

      <BusinessTypeDialog
        instance={instance}
        onOpenChange={setBusinessDialogOpen}
        open={businessDialogOpen}
      />
    </>
  )
}
