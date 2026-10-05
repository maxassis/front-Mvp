import type { Lead } from '@/api/types'

/** O backend preenche o interesse com este texto quando o LLM nao achou nada. */
const PLACEHOLDER_INTEREST = 'Interesse geral'

/**
 * Formata um telefone brasileiro. Devolve null para o que nao for um numero de
 * telefone, porque o `chatId` tambem guarda conversas de grupo (`@g.us`) e
 * identificadores deusuario sem numero (`@lid`) — o backend ja separa os dois
 * casos em extractPhone (leads/lead-values.ts:6).
 */
export const formatPhone = (value: string | null | undefined): string | null => {
  if (!value) {
    return null
  }

  const digits = value.replaceAll(/\D/gu, '')
  if (digits.length < 8) {
    return null
  }

  const national = digits.startsWith('55') ? digits.slice(2) : digits

  if (national.length === 11) {
    return `+55 (${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`
  }

  if (national.length === 10) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`
  }

  return digits
}

const phoneFromChatId = (chatId: string): string | null => {
  if (chatId.includes('@lid') || chatId.includes('@g.us')) {
    return null
  }
  return formatPhone(chatId.split('@')[0] ?? '')
}

export const leadPhone = (lead: Pick<Lead, 'chatId' | 'phone'>): string | null =>
  formatPhone(lead.phone) ?? phoneFromChatId(lead.chatId)

/** O interesse so aparece quando o LLM extraiu algo de verdade. */
export const leadIntent = (lead: Pick<Lead, 'intent'>): string | null => {
  const intent = lead.intent?.trim()
  return intent && intent !== PLACEHOLDER_INTEREST ? intent : null
}

/**
 * Nome preferencial com queda para telefone e depois para um rotulo neutro.
 * Nao existe mais um nome placeholder vindo do backend (DEFAULT_LEAD_NAME e
 * null), entao qualquer string preenchida e um nome real.
 */
export const leadDisplayName = (lead: Pick<Lead, 'chatId' | 'name' | 'phone'>): string => {
  const name = lead.name?.trim()
  if (name) {
    return name
  }
  return leadPhone(lead) ?? 'Cliente'
}

/** Linha de apoio no cabecalho: telefone e interesse, o que existir. */
export const leadSubtitle = (lead: Pick<Lead, 'chatId' | 'intent' | 'phone'>): string => {
  const phone = leadPhone(lead)
  const intent = leadIntent(lead)
  return [phone, intent].filter(Boolean).join(' · ') || 'Sem telefone'
}
