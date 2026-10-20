import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, api } from '@/api/client'
import { demoChatbotReplySchema } from '@/api/types'
import type { DemoChatbotBody } from '@/api/types'
import { demoKeys } from './queries'

const notifyError = (error: unknown): void => {
  // O 429 do teste limitado ja ganha banner na propria conversa; o bruto em
  // ingles do backend nao precisa duplicar em toast. Outros erros avisam.
  if (error instanceof ApiError && error.status === 429) {
    return
  }
  toast.error(error instanceof Error ? error.message : 'Operacao falhou')
}

export const useSendDemoChatbot = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: DemoChatbotBody) =>
      api.post('/api/demo/chatbot', demoChatbotReplySchema, body),
    // Todo envio consome uma mensagem do saldo do dia, entao o contador so
    // fica certo se o uso for revalidado aqui, e nao so na abertura.
    onError: notifyError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: demoKeys.usage })
  })
}
