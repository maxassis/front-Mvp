import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/api/client'
import type { Lead } from '@/api/types'
import { leadMessageSchema, leadSchema } from '@/api/types'
import { leadKeys } from '@/features/leads/queries'

const notifyError = (error: unknown): void => {
  toast.error(error instanceof Error ? error.message : 'Operacao falhou')
}

export const invalidateLeadCaches = (
  queryClient: QueryClient,
  instanceId: string,
  leadId: string
): Promise<void> =>
  Promise.all([
    // O prefixo cobre todas as abas de status da instancia atual, mas o
    // detalhe por id mora fora dele e precisa da chave propria.
    queryClient.invalidateQueries({ queryKey: [...leadKeys.all, instanceId] }),
    queryClient.invalidateQueries({ queryKey: leadKeys.byId(leadId) }),
    queryClient.invalidateQueries({ queryKey: leadKeys.messages(leadId) })
  ]).then(() => undefined)

export interface SendLeadMessageInput {
  leadId: string
  text: string
}

export const useAssignLead = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leadId: string) => api.post(`/api/leads/${leadId}/assign`, leadSchema),
    onError: notifyError,
    onSuccess: (lead: Lead, leadId) => {
      queryClient.setQueryData(leadKeys.byId(leadId), lead)
      return invalidateLeadCaches(queryClient, instanceId, leadId)
    }
  })
}

export const useCloseLead = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leadId: string) => api.post(`/api/leads/${leadId}/close`, leadSchema),
    onError: notifyError,
    onSuccess: (lead: Lead, leadId) => {
      queryClient.setQueryData(leadKeys.byId(leadId), lead)
      return invalidateLeadCaches(queryClient, instanceId, leadId)
    }
  })
}

export const useSendLeadMessage = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SendLeadMessageInput) =>
      api.post(`/api/leads/${input.leadId}/messages`, leadMessageSchema, { text: input.text }),
    onError: notifyError,
    onSuccess: (_message, input) => invalidateLeadCaches(queryClient, instanceId, input.leadId)
  })
}
