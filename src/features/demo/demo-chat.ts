import type { DemoChatbotAnswers, DemoChatbotTurn } from '@/api/types'

export interface DemoMessage {
  id: number
  role: 'visitor' | 'assistant'
  text: string
}

export interface DemoChat {
  nextId: number
  answers: DemoChatbotAnswers
  messages: DemoMessage[]
}

/** A abertura do demo e uma chamada sem fala do visitante. */
export const OPENING_INPUT = ''

/**
 * Cada fala do visitante conta como uma troca. Teto de UX (encurta o teste e
 * leva ao CTA) e teto do backend, que recusa a conversa com
 * DEMO_EXCHANGE_LIMIT.
 */
export const MAX_DEMO_EXCHANGES = 8

export const emptyDemoChat = (answers: DemoChatbotAnswers): DemoChat => ({
  nextId: 1,
  answers,
  messages: []
})

export const addMessage = (
  chat: DemoChat,
  role: DemoMessage['role'],
  text: string
): DemoChat => ({
  ...chat,
  nextId: chat.nextId + 1,
  messages: [...chat.messages, { id: chat.nextId, role, text }]
})

export const historyTurns = (messages: DemoMessage[]): DemoChatbotTurn[] =>
  messages.map((message) => ({
    role: message.role === 'visitor' ? 'customer' : 'assistant',
    text: message.text.trim()
  }))

export const demoIsFull = (chat: DemoChat): boolean =>
  chat.messages.filter((message) => message.role === 'visitor').length >= MAX_DEMO_EXCHANGES

export const joinTurns = (chat: DemoChat, input: string, reply: string): DemoChat =>
  addMessage(addMessage(chat, 'visitor', input), 'assistant', reply)
