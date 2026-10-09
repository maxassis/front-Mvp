import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/api/client'
import { whatsappInstanceSchema } from '@/api/types'
import { buildSetBusinessTypeBody } from '@/features/instances/business-type'
import type { SetBusinessTypeInput } from '@/features/instances/business-type'
import { instanceKeys } from '@/features/instances/queries'
import { useUiStore } from '@/stores/ui-store'

const notifyError = (error: unknown): void => {
  toast.error(error instanceof Error ? error.message : 'Operacao falhou')
}

export const useToggleChatbot = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (chatbotEnabled: boolean) =>
      api.patch(`/api/whatsapp/instances/${instanceId}`, whatsappInstanceSchema, {
        chatbot_enabled: chatbotEnabled
      }),
    onError: notifyError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instanceKeys.all })
  })
}

export const useSetBusinessType = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SetBusinessTypeInput) =>
      api.patch(
        `/api/whatsapp/instances/${instanceId}`,
        whatsappInstanceSchema,
        buildSetBusinessTypeBody(input)
      ),
    onError: notifyError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instanceKeys.all })
  })
}

export const useStopInstance = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post(`/api/whatsapp/instances/${instanceId}/stop`, whatsappInstanceSchema),
    onError: notifyError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instanceKeys.all })
  })
}

export const useRemoveInstance = () => {
  const queryClient = useQueryClient()
  const selectInstance = useUiStore((state) => state.selectInstance)

  return useMutation({
    mutationFn: (instanceId: string) => api.delete(`/api/whatsapp/instances/${instanceId}`),
    onError: notifyError,
    onSuccess: async (_data, instanceId) => {
      // Lido direto da store para nao decidir com uma selecao capturada no render.
      if (useUiStore.getState().selectedInstanceId === instanceId) {
        selectInstance(null)
      }
      await queryClient.invalidateQueries({ queryKey: instanceKeys.all })
    }
  })
}
