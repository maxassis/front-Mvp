import type { Lead } from '@/api/types'

/** O backend preenche o interesse com este texto quando o LLM nao achou nada. */
const PLACEHOLDER_INTEREST = 'Interesse geral'

/**
 * Formata um telefone brasileiro. Devolve null para o que nao for um numero de
 * telefone, porque o `chatId` tambem guarda conversas de grupo (`@g.us`) e
 * identificadores deusuario sem numero (`@lid`) — o backend ja separa os dois
 * casos em extractPhone (leads/lead-values.ts:6).
 *
 * So formata 10 ou 11 digitos uteis, que e o que o WhatsApp entrega para chat
 * privado no Brasil. Qualquer outra coisa volta crua: chutar o DDD de um numero
 * desconhecido produz um telefone errado e crivel, que e pior que nenhum.
 */
export const formatPhone = (value: string | null | undefined): string | null => {
  if (!value) {
    return null
  }

  const digits = value.replaceAll(/\D/gu, '')
  if (digits.length < 8) {
    return null
  }

  // O 55 do DDD nao pode ser confundido com o do codigo de pais. O WhatsApp
  // brasileiro manda 13 digitos com 55; um celular nacional de DDD 55 tem 11
  // digitos comecados por 55 e nao tem codigo de pais.
  const hasCountryCode =
    (digits.length === 13 || digits.length === 12) && digits.startsWith('55')
  const national = hasCountryCode ? digits.slice(2) : digits

  if (national.length === 11) {
    const area = national.slice(0, 2)
    const prefix = hasCountryCode ? '+55 ' : ''
    return `${prefix}(${area}) ${national.slice(2, 7)}-${national.slice(7)}`
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

/** Rotulo por tipo de midia; tipo desconhecido (ou texto vazio) cai em 'Mensagem'. */
const MESSAGE_TYPE_LABEL: Record<string, string> = {
  audio: 'Audio',
  document: 'Documento',
  image: 'Foto',
  location: 'Localizacao',
  sticker: 'Figurinha',
  video: 'Video'
}

/**
 * A projecao do lead nao traz foto de perfil, entao o avatar sai das iniciais
 * do nome; sem nome, dos digitos do telefone; sem telefone, de um rotulo neutro.
 */
export const leadInitials = (lead: Pick<Lead, 'chatId' | 'name' | 'phone'>): string => {
  const name = lead.name?.trim()
  if (name) {
    const words = name.split(/\s+/u)
    const first = words[0]?.[0] ?? ''
    const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : ''
    return `${first}${last}`.toUpperCase()
  }

  const digits = leadPhone(lead)?.replaceAll(/\D/gu, '') ?? ''
  return digits.length > 0 ? digits.slice(0, 2) : 'C'
}

/**
 * Previa de uma linha da ultima mensagem. Sem texto, o tipo vira rotulo; o
 * prefixo separa a fala do atendente da fala do cliente.
 */
export const leadLastMessagePreview = (lead: Pick<Lead, 'lastMessage'>): string | null => {
  const message = lead.lastMessage
  if (!message) {
    return null
  }
  const text = message.text?.trim()
  const body = text ? text : (MESSAGE_TYPE_LABEL[message.messageType] ?? 'Mensagem')
  return message.direction === 'outbound' ? `Voce: ${body}` : body
}

/**
 * Horario da ultima mensagem, com queda para a conversa e depois para o lead.
 * Hoje vira HH:mm; outro dia vira dd/MM. `now` entra por parametro para o teste
 * fixar o dia sem depender do relogio.
 */
export const leadLastMessageTime = (
  lead: Pick<Lead, 'conversation' | 'lastMessage' | 'updatedAt'>,
  now: Date = new Date()
): string => {
  const value = lead.lastMessage?.receivedAt ?? lead.conversation.lastMessageAt ?? lead.updatedAt
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  return isToday
    ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
