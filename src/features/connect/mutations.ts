import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { api } from '@/api/client'
import { whatsappInstanceSchema } from '@/api/types'
import { connectKeys } from '@/features/connect/queries'
import { instanceKeys } from '@/features/instances/queries'

const notifyError = (error: unknown): void => {
  toast.error(error instanceof Error ? error.message : 'Operacao falhou')
}

export interface CreateInstanceInput {
  instanceName?: string
  phoneNumber: string
}

interface CreateInstanceBody {
  agenda_enabled: false
  instance_name?: string
  phone_number: string
  provider: 'waha'
  provider_instance_id: string
}

const newProviderInstanceId = (): string => `waha-${crypto.randomUUID()}`

export const useCreateInstance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateInstanceInput) => {
      const body: CreateInstanceBody = {
        // A criacao recusa agenda_enabled true; a agenda so e liga depois, no onboarding.
        agenda_enabled: false,
        phone_number: input.phoneNumber,
        provider: 'waha',
        provider_instance_id: newProviderInstanceId()
      }

      const instanceName = input.instanceName?.trim()
      if (instanceName) {
        body.instance_name = instanceName
      }

      return api.post('/api/whatsapp/instances', whatsappInstanceSchema, body)
    },
    onError: notifyError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instanceKeys.all })
  })
}

export const useStartInstance = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post(`/api/whatsapp/instances/${instanceId}/start`, whatsappInstanceSchema),
    onError: notifyError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instanceKeys.all })
  })
}

/**
 * Reiniciar devolve a sessao ao estado em que a WAHA volta a emitir QR. E o
 * unico caminho de volta quando a sessao cai, ja que o endpoint de QR responde
 * 422 fora de SCAN_QR_CODE e nao ha leitura que conserte isso.
 */
export const useRestartInstance = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post(`/api/whatsapp/instances/${instanceId}/restart`, whatsappInstanceSchema),
    onError: notifyError,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: instanceKeys.all })
      await queryClient.invalidateQueries({ queryKey: connectKeys.qr(instanceId) })
      await queryClient.invalidateQueries({ queryKey: connectKeys.session(instanceId) })
    }
  })
}

/** A WAHA repassa sem contrato fixo, entao a leitura tolera e falha com mensagem propria. */
const pairingCodeBodySchema = z.looseObject({})

const readPairingCode = (body: unknown): string => {
  const parsed = pairingCodeBodySchema.safeParse(body)
  const code: unknown = parsed.success ? (parsed.data.code ?? parsed.data.pairingCode) : null
  const text = typeof code === 'string' ? code.trim() : ''

  if (text.length === 0) {
    throw new Error('O servidor nao devolveu um codigo de pareamento')
  }

  return text
}

export const useRequestPairingCode = (instanceId: string, phoneNumber: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // A rota valida o corpo em 10-15 caracteres antes do service, entao o
      // numero com mascara quebraria a chamada; digitos sao o que vale.
      const body: unknown = await api.post(
        `/api/whatsapp/instances/${instanceId}/pairing-code`,
        z.unknown(),
        { phoneNumber: phoneNumber.replaceAll(/\D/gu, '') }
      )
      return readPairingCode(body)
    },
    onError: notifyError,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: instanceKeys.all }),
        queryClient.invalidateQueries({ queryKey: connectKeys.qr(instanceId) })
      ])
  })
}