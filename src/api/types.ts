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

/** Origem: apps/backend/src/modules/whatsapp/whatsapp-instances.schema.ts. */
export const BUSINESS_TYPES = [
  'saude',
  'beleza',
  'alimentacao',
  'comercio',
  'servicos',
  'educacao',
  'outros'
] as const
export type BusinessType = (typeof BUSINESS_TYPES)[number]

export const BUSINESS_TYPE_LABELS = {
  alimentacao: 'Alimentação',
  beleza: 'Beleza',
  comercio: 'Comércio',
  educacao: 'Educação',
  outros: 'Outros',
  saude: 'Saúde',
  servicos: 'Serviços'
} as const satisfies Record<BusinessType, string>

/** Origem: apps/backend/src/database/schema.ts, tabela whatsapp_instances. */
export const whatsappInstanceSchema = z.object({
  agendaEnabled: z.boolean(),
  businessType: z.enum(BUSINESS_TYPES).nullable(),
  businessTypeLabel: z.string().nullable(),
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
  status: z.enum(LEAD_STATUSES),
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

/**
 * Origem: apps/backend/src/modules/onboarding/onboarding.schema.ts (pedido)
 * e onboarding.service.ts (resposta = linha crua do Drizzle, sem serializer).
 *
 * O pedido vai em snake_case e a resposta volta em camelCase. O GET devolve
 * array solto, o POST 201 com um item, o PATCH 200 com um item e o DELETE
 * 204 sem corpo.
 */
export const onboardingItemSchema = z.object({
  answer: z.string().nullable(),
  answerJson: z.unknown().nullable(),
  createdAt: z.string(),
  enabled: z.boolean(),
  fieldKey: z.string(),
  id: z.string(),
  question: z.string(),
  required: z.boolean(),
  sortOrder: z.number(),
  updatedAt: z.string(),
  userId: z.string(),
  whatsappInstanceId: z.string()
})

export type OnboardingItem = z.infer<typeof onboardingItemSchema>

export const onboardingItemListSchema = z.array(onboardingItemSchema)

/**
 * Origem: apps/backend/src/modules/rag/rag.routes.ts (rotas) e
 * rag-files.service.ts (select explicito e constantes de validacao).
 *
 * Aqui o casing inverte em relacao ao onboarding: pedido e query usam
 * camelCase (`instanceId`) e a resposta volta em snake_case. `upload_status`
 * e varchar sem enum no banco, entao o campo parseia como string e os
 * valores conhecidos moram em UPLOAD_STATUSES para rotulo e poll, sem
 * derrubar a tela se o backend ganhar um status novo.
 */
export const UPLOAD_STATUSES = [
  'failed',
  'pending-upload',
  'processing',
  'queued',
  'ready'
] as const
export type UploadStatus = (typeof UPLOAD_STATUSES)[number]

export const ragFileSchema = z.object({
  chunks_count: z.number(),
  created_at: z.string(),
  id: z.string(),
  indexed_at: z.string().nullable(),
  mime_type: z.string().nullable(),
  name: z.string(),
  size_bytes: z.number().nullable(),
  storage_path: z.string(),
  upload_batch_id: z.string().nullable(),
  upload_error: z.string().nullable(),
  upload_status: z.string()
})

export type RagFile = z.infer<typeof ragFileSchema>

/** O GET /api/files devolve envelope, nao array solto. */
export const fileListSchema = z.object({ files: z.array(ragFileSchema) })

export const presignedFileSchema = z.object({
  file_id: z.string(),
  signed_url: z.string(),
  storage_path: z.string(),
  token: z.string()
})

export const presignResponseSchema = z.object({
  batch_id: z.string(),
  files: z.array(presignedFileSchema)
})

export const confirmUploadResponseSchema = z.object({ status: z.string() })

export const deleteFileResponseSchema = z.object({ success: z.literal(true) })
