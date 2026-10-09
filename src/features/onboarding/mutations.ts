import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/api/client'
import { onboardingItemSchema } from '@/api/types'
import { onboardingKeys } from '@/features/onboarding/queries'

const notifyError = (error: unknown): void => {
  toast.error(error instanceof Error ? error.message : 'Operacao falhou')
}

export interface CreateOnboardingItemInput {
  answer: string
  enabled: boolean
  fieldKey: string
  question: string
  required: boolean
  sortOrder: number
}

export const useCreateOnboardingItem = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateOnboardingItemInput) =>
      api.post('/api/onboarding/items', onboardingItemSchema, {
        answer: input.answer,
        enabled: input.enabled,
        field_key: input.fieldKey,
        question: input.question,
        required: input.required,
        sort_order: input.sortOrder,
        whatsapp_instance_id: instanceId
      }),
    onError: notifyError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.items(instanceId) })
  })
}

export interface UpdateOnboardingItemInput {
  answer: string
  itemId: string
}

/** Edita só a resposta. A pergunta vem do catálogo e não muda por aqui. */
export const useUpdateOnboardingItem = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateOnboardingItemInput) =>
      api.patch(`/api/onboarding/items/${input.itemId}`, onboardingItemSchema, {
        answer: input.answer
      }),
    onError: notifyError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.items(instanceId) })
  })
}

export interface ToggleOnboardingItemInput {
  enabled: boolean
  itemId: string
}

/** O PATCH e parcial: so `enabled` basta para ligar e desligar. */
export const useToggleOnboardingItem = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ToggleOnboardingItemInput) =>
      api.patch(`/api/onboarding/items/${input.itemId}`, onboardingItemSchema, {
        enabled: input.enabled
      }),
    onError: notifyError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.items(instanceId) })
  })
}

/** O DELETE responde 204 sem corpo, entao `api.delete` nao valida nada. */
export const useRemoveOnboardingItem = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/api/onboarding/items/${itemId}`),
    onError: notifyError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.items(instanceId) })
  })
}
