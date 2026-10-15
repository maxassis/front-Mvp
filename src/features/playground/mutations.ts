import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api, buildUrl } from '@/api/client'
import { chatbotTestReplySchema } from '@/api/types'
import type { ChatbotTestRole } from '@/api/types'

export interface ChatbotTestTurn {
  role: ChatbotTestRole
  text: string
}

export interface ChatbotTestInput {
  input: string
  slots: Record<string, string>
  turns: ChatbotTestTurn[]
}

const notifyError = (error: unknown): void => {
  toast.error(error instanceof Error ? error.message : 'Operacao falhou')
}

export const useTestChatbot = (instanceId: string) =>
  useMutation({
    mutationFn: (input: ChatbotTestInput) =>
      api.post(
        buildUrl('/api/chatbot/test', { instanceId }),
        chatbotTestReplySchema,
        { input: input.input, slots: input.slots, turns: input.turns }
      ),
    onError: notifyError
  })
