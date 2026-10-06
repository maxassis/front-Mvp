import { z } from 'zod'

/**
 * Espelho manual dos contratos do backend em elysia-rag-api. A origem de cada
 * grupo esta anotada no arquivo de onde ele foi copiado; quando o backend
 * mudar a forma, o parse aqui passa a falhar em vez de devolver `undefined`
 * fundo no componente.
 *
 * Datas chegam como string: o backend devolve Date e o JSON serializa.
 */

export const LEAD_STATUSES = ['new', 'assigned', 'closed'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const INSTANCE_STATUSES = ['pending', 'connected', 'disconnected', 'error'] as const
export type InstanceStatus = (typeof INSTANCE_STATUSES)[number]

export const WHATSAPP_PROVIDERS = ['waha', 'whatsapp_cloud_api'] as const
export type WhatsappProvider = (typeof WHATSAPP_PROVIDERS)[number]

/** Origem: apps/backend/src/database/schema.ts, tabela whatsapp_instances. */
export const whatsappInstanceSchema = z.object({
  agendaEnabled: z.boolean(),
  chatbotEnabled: z.boolean(),
  createdAt: z.string(),
  id: z.string(),
  instanceName: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  phoneNumber: z.string(),
  provider: z.enum(WHATSAPP_PROVIDERS),
  providerInstanceId: z.string(),
  state: z.string().nullable(),
  status: z.enum(INSTANCE_STATUSES),
  updatedAt: z.string(),
  userId: z.string()
})

export type WhatsappInstance = z.infer<typeof whatsappInstanceSchema>

/** Origem: apps/backend/src/modules/leads/leads.service.ts. */
export const leadConversationSchema = z.object({
  chatId: z.string(),
  chatType: z.string(),
  createdAt: z.string(),
  id: z.string(),
  instanceId: z.string(),
  lastMessageAt: z.string().nullable(),
  status: z.string()
})

export const leadSchema = z.object({
  chatId: z.string(),
  conversation: leadConversationSchema,
  conversationId: z.string(),
  createdAt: z.string(),
  email: z.string().nullable(),
  id: z.string(),
  intent: z.string().nullable(),
  isReturn: z.boolean(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  previousLeadId: z.string().nullable(),
  // O backend ja devolveu status fora de new|assigned|closed e o parse estrito
  // derrubava a lista inteira (erro "Invalid option" no path [0, status]).
  // Status desconhecido cai para 'new' para a tela continuar abrindo; quando o
  // backend fixar o contrato, o valor volta a passar direto.
  status: z.enum(LEAD_STATUSES).catch('new'),
  updatedAt: z.string()
})

export const leadMessageSchema = z.object({
  author: z.string(),
  direction: z.string(),
  id: z.string(),
  messageType: z.string(),
  receivedAt: z.string(),
  text: z.string().nullable()
})

export type Lead = z.infer<typeof leadSchema>
export type LeadMessage = z.infer<typeof leadMessageSchema>

/** Origem: apps/backend/src/modules/onboarding/onboarding.service.ts. */
export const agendaSetupStatusSchema = z.object({
  complete: z.boolean(),
  hasActiveProfessional: z.boolean(),
  missingFields: z.array(z.string())
})

/**
 * A WAHA responde com `Record<string, unknown>` e o backend repassa sem tipar
 * (whatsapp-instances.service.ts:28-29), entao o reader e deliberadamente
 * tolerante: escolhe o primeiro formato de QR que aparecer e devolve null
 * quando nenhum serve.
 */
export type QrPayload =
  | { kind: 'data-uri'; src: string }
  | { kind: 'remote'; src: string }

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null

export const readQrPayload = (body: unknown): QrPayload | null => {
  const record = asRecord(body)
  if (!record) {
    return null
  }

  const base64 = asNonEmptyString(record.base64)
  if (base64) {
    return { kind: 'data-uri', src: `data:image/png;base64,${base64}` }
  }

  const data = asNonEmptyString(record.data)
  const mimetype = asNonEmptyString(record.mimetype)
  if (data && mimetype) {
    return { kind: 'data-uri', src: `data:${mimetype};base64,${data}` }
  }

  const url = asNonEmptyString(record.url)
  if (url) {
    return { kind: 'remote', src: url }
  }

  return null
}

/** Origem: apps/backend/src/providers/waha/waha-status-map.ts. */
export const readWahaStatus = (body: unknown): string | null =>
  asNonEmptyString(asRecord(body)?.status)

/**
 * Origem: contrato congelado do stream GET /api/realtime/events (SSE).
 * `kind` e fixo no nome do evento do quadro e `messageId` so acompanha o
 * payload quando ha mensagem nova na conversa.
 */
export const conversationChangedSchema = z.object({
  at: z.string(),
  conversationId: z.string(),
  direction: z.enum(['inbound', 'outbound']),
  id: z.string(),
  instanceId: z.string(),
  kind: z.literal('conversation.changed'),
  messageId: z.string().optional()
})

export type ConversationChanged = z.infer<typeof conversationChangedSchema>
