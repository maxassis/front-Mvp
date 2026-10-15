import { describe, expect, test } from 'bun:test'

import type { ChatbotTestReply } from '@/api/types'
import { addReply, emptyChat, historyTurns, replyBubbles } from './playground-chat'

const replyWith = (overrides: Partial<ChatbotTestReply>): ChatbotTestReply => ({
  resposta: 'Resposta unica',
  slots: {},
  ...overrides
})

describe('playground chat', () => {
  test('respostas em lista viram gomos; sem lista cai no texto unico', () => {
    expect(replyBubbles(replyWith({ resposta: 'Unico', respostas: ['Ola', 'Sim'] }))).toEqual([
      'Ola',
      'Sim'
    ])
    expect(replyBubbles(replyWith({ respostas: [] }))).toEqual(['Resposta unica'])
    expect(replyBubbles(replyWith({}))).toEqual(['Resposta unica'])
  })

  test('historico repareia cliente e bot por turno', () => {
    const chat = addReply(addReply(emptyChat(), 'Ola', replyWith({ resposta: 'Oi!' })), 'Horario?', replyWith({ resposta: '10h' }))

    expect(historyTurns(chat.turns)).toEqual([
      { role: 'customer', text: 'Ola' },
      { role: 'assistant', text: 'Oi!' },
      { role: 'customer', text: 'Horario?' },
      { role: 'assistant', text: '10h' }
    ])
  })

  test('addReply guarda a resposta, os slots mesclados e id novo', () => {
    const chat = addReply(emptyChat(), 'Ola', replyWith({ resposta: 'Oi!', slots: { nome: 'Ana' } }))

    expect(chat.turns).toHaveLength(1)
    expect(chat.turns[0]?.id).toBe(1)
    expect(chat.turns[0]?.reply.resposta).toBe('Oi!')
    expect(chat.slots).toEqual({ nome: 'Ana' })
    expect(chat.nextId).toBe(2)
  })
})
