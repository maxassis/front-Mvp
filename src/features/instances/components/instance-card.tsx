import { useNavigate } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'

import type { WhatsappInstance, WhatsappProvider } from '@/api/types'
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

  const displayName = instance.instanceName ?? instance.phoneNumber

  const handleOpenLeads = () => {
    selectInstance(instance.id)
    void navigate({ to: '/leads' })
  }

  // `/connect` decide entre o formulario e o QR a partir da instancia
  // selecionada, entao conectar tem que selecionar antes de navegar.
  const handleConnect = () => {
    selectInstance(instance.id)
    void navigate({ to: '/connect' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0 truncate">{displayName}</CardTitle>
        <CardDescription>{instance.phoneNumber}</CardDescription>
        <CardAction>
          <InstanceStatusBadge status={instance.status} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-3">
        <Badge variant="outline">{PROVIDER_LABEL[instance.provider]}</Badge>

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
            onCheckedChange={(enabled) => toggleChatbot.mutate(enabled)}
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
        <RemoveInstanceDialog instance={instance} />
      </CardFooter>
    </Card>
  )
}
