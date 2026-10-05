import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { api, buildUrl } from '@/api/client'
import type { LeadStatus } from '@/api/types'
import { leadMessageSchema, leadSchema } from '@/api/types'
import { CHAT_POLL_INTERVAL_MS } from '@/lib/query-client'

export const leadKeys = {
  all: ['leads'] as const,
  list: (instanceId: string, status: LeadStatus | 'all') =>
    [...leadKeys.all, instanceId, status] as const,
  messages: (leadId: string) => [...leadKeys.all, 'messages', leadId] as const
}

export interface LeadsQueryInput {
  instanceId: string
  status: LeadStatus | 'all'
}

export const leadsQuery = (input: LeadsQueryInput) =>
  queryOptions({
    enabled: Boolean(input.instanceId),
    queryFn: () =>
      api.get(
        buildUrl('/api/leads', {
          instance_id: input.instanceId,
          status: input.status === 'all' ? undefined : input.status
        }),
        z.array(leadSchema)
      ),
    queryKey: leadKeys.list(input.instanceId, input.status),
    refetchInterval: CHAT_POLL_INTERVAL_MS
  })

export const leadMessagesQuery = (leadId: string) =>
  queryOptions({
    enabled: Boolean(leadId),
    // include_history junta a cadeia de leads anteriores do mesmo cliente, e o
    // backend ja devolve tudo em ordem cronologica. Sem ele, um lead marcado
    // como isReturn aparece com a conversa anterior invisivel.
    queryFn: () =>
      api.get(
        buildUrl(`/api/leads/${leadId}/messages`, { include_history: 'true' }),
        z.array(leadMessageSchema)
      ),
    queryKey: leadKeys.messages(leadId),
    refetchInterval: CHAT_POLL_INTERVAL_MS
  })
