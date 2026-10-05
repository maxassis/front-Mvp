import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { ApiError, api } from '@/api/client'
import type { QrPayload } from '@/api/types'
import { readQrPayload, readWahaStatus } from '@/api/types'

/** A WAHA rotaciona o QR; um poll curto mantem a imagem valida na tela. */
const QR_POLL_INTERVAL_MS = 2_000
const SESSION_POLL_INTERVAL_MS = 3_000

export const connectKeys = {
  all: ['connect'] as const,
  qr: (instanceId: string) => [...connectKeys.all, 'qr', instanceId] as const,
  session: (instanceId: string) => [...connectKeys.all, 'session', instanceId] as const
}

/**
 * A WAHA so entrega QR com a sessao em SCAN_QR_CODE; para qualquer outro status
 * ela responde 422 e nao adianta continuar Asking. Isso e o estado em que uma
 * sessao cai depois de expirar ou perder o pareamento, e e o sinal de que a
 * unica saida e reiniciar a sessao antes de pedir o QR de novo.
 */
export const qrIsUnavailable = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) {
    return false
  }
  // O backend repassa a falha da WAHA como 500 quando nao mapeia o 422.
  return error.status === 422 || error.status === 500
}

export const wahaQrQuery = (instanceId: string, enabled: boolean) =>
  queryOptions({
    enabled: enabled && Boolean(instanceId),
    queryFn: async () => {
      const body: unknown = await api.get(`/api/whatsapp/instances/${instanceId}/qr`, z.unknown())
      return readQrPayload(body)
    },
    queryKey: connectKeys.qr(instanceId),
    refetchInterval: QR_POLL_INTERVAL_MS,
    retry: false
  })

/**
 * `WORKING` e o estado da WAHA que o mapeia para `connected` no banco
 * (providers/waha/waha-status-map.ts). E o sinal de que o pareamento terminou.
 */
export const wahaSessionQuery = (instanceId: string, enabled: boolean) =>
  queryOptions({
    enabled: enabled && Boolean(instanceId),
    queryFn: async () => {
      const body: unknown = await api.get(
        `/api/whatsapp/instances/${instanceId}/session`,
        z.unknown()
      )
      const status = readWahaStatus(body)
      return { isWorking: status === 'WORKING', status }
    },
    queryKey: connectKeys.session(instanceId),
    refetchInterval: SESSION_POLL_INTERVAL_MS,
    retry: false
  })

export type QrResult = QrPayload | null
