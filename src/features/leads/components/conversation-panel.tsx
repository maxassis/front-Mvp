import { useQuery } from '@tanstack/react-query'
import { MessageSquare, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import type { Lead, LeadMessage } from '@/api/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { leadDisplayName, leadSubtitle } from '@/features/leads/lead-display'
import { leadLifecycle } from '@/features/leads/lead-lifecycle'
import { useAssignLead, useCloseLead } from '@/features/leads/mutations'
import { leadMessagesQuery } from '@/features/leads/queries'
import { MessageComposer } from '@/features/leads/components/message-composer'
import { cn } from '@/lib/utils'

interface ConversationPanelProps {
  instanceId: string
  lead: Lead | undefined
  onRefreshLeadList: () => void
}

const formatMessageTime = (value: string): string =>
  new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const byReceivedAt = (a: LeadMessage, b: LeadMessage): number =>
  new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()

/** Folga em px que ainda conta como "o operador esta no fim da conversa". */
const STICK_TO_BOTTOM_SLACK_PX = 48

function MessageBubble({ message }: { message: LeadMessage }) {
  const isOutgoing = message.direction === 'outbound'
  return (
    <div className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2',
          isOutgoing ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {message.text ? <p className="text-sm whitespace-pre-wrap">{message.text}</p> : null}
        <p
          className={cn(
            'mt-1 text-right text-[11px]',
            isOutgoing ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {formatMessageTime(message.receivedAt)}
        </p>
      </div>
    </div>
  )
}

export function ConversationPanel({ instanceId, lead, onRefreshLeadList }: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const assignLead = useAssignLead(instanceId)
  const closeLead = useCloseLead(instanceId)
  const messages = useQuery(leadMessagesQuery(lead?.id ?? ''))

  const orderedMessages = useMemo(() => [...(messages.data ?? [])].sort(byReceivedAt), [messages.data])
  const lastLeadId = lead?.id ?? null

  // Trocar de lead sempre abre no fim: abrir no topo de um historico longo
  // esconde a conversa atual. A troca e o unico momento em que o scroll ignora
  // a posicao em que o operador estava.
  useEffect(() => {
    const container = scrollRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [lastLeadId])

  // A lista faz poll a cada 5s. Rolar para o fim a cada atualizacao jogaria o
  // operador de volta para baixo enquanto ele le o historico, entao o scroll so
  // acontece quando ele ja estava colado no fim.
  useEffect(() => {
    const container = scrollRef.current
    if (!container) {
      return
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight

    if (distanceFromBottom <= STICK_TO_BOTTOM_SLACK_PX) {
      container.scrollTop = container.scrollHeight
    }
  }, [orderedMessages])

  if (!lead) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <MessageSquare className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Selecione um lead para ver a conversa</p>
      </div>
    )
  }

  const lifecycle = leadLifecycle(lead.status)

  const handleRefresh = async (): Promise<void> => {
    await messages.refetch()
    onRefreshLeadList()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{leadDisplayName(lead)}</p>
          <p className="truncate text-xs text-muted-foreground">{leadSubtitle(lead)}</p>
        </div>
        {lifecycle.canAssign ? (
          <Button
            disabled={assignLead.isPending}
            onClick={() => assignLead.mutate(lead.id)}
            size="sm"
            type="button"
          >
            {assignLead.isPending ? 'Assumindo...' : 'Assumir'}
          </Button>
        ) : null}
        {lifecycle.canClose ? (
          <Button
            disabled={closeLead.isPending}
            onClick={() => closeLead.mutate(lead.id)}
            size="sm"
            type="button"
            variant="outline"
          >
            {closeLead.isPending ? 'Fechando...' : 'Fechar'}
          </Button>
        ) : null}
        <Button
          aria-label="Atualizar conversa"
          disabled={messages.isFetching}
          onClick={() => void handleRefresh()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <RefreshCw className={cn(messages.isFetching && 'animate-spin')} />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-2 p-3 pb-4">
          {messages.isPending ? (
            <div className="space-y-2">
              {[0, 1, 2].map((index) => (
                <Skeleton className="h-12 w-3/4" key={index} />
              ))}
            </div>
          ) : messages.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Nao foi possivel carregar as mensagens. {messages.error.message}
              </AlertDescription>
            </Alert>
          ) : orderedMessages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <MessageSquare className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
            </div>
          ) : (
            orderedMessages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}
        </div>
      </div>

      {lifecycle.canSendMessage ? (
        <MessageComposer instanceId={instanceId} key={lead.id} leadId={lead.id} />
      ) : (
        <p className="border-t p-3 text-center text-sm text-muted-foreground">
          {lifecycle.composerNote}
        </p>
      )}
    </div>
  )
}
