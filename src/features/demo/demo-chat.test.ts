import { describe, expect, test } from 'bun:test'

import type { DemoChatbotAnswers } from '@/api/types'
import {
  MAX_DEMO_EXCHANGES,
  OPENING_INPUT,
  addMessage,
  demoIsFull,
  emptyDemoChat,
  historyTurns,
  joinTurns
} from './demo-chat'

const answers: DemoChatbotAnswers = {
  assistantName: 'Ana',
  businessName: 'Petshop Amigo',
  businessType: 'outros',
  businessTypeLabel: 'Petshop',
  differential: 'Atendimento sem fila',
  offerings: 'Banho e tosa',
  tone: 'Amigavel'
}

describe('demo chat', () => {
  test('estado inicial guarda as respostas e comeca sem mensagens', () => {
    const chat = emptyDemoChat(answers)
    expect(chat.messages).toEqual([])
    expect(chat.nextId).toBe(1)
    expect(chat.answers).toBe(answers)
  })

  test('a abertura vai sem fala do visitante', () => {
    expect(OPENING_INPUT).toBe('')
  })

  test('addMessage anexa com id crescente e papel', () => {
    const chat = addMessage(addMessage(emptyDemoChat(answers), 'assistant', 'Ola!'), 'visitor', 'Oi')

    expect(chat.messages).toEqual([
      { id: 1, role: 'assistant', text: 'Ola!' },
      { id: 2, role: 'visitor', text: 'Oi' }
    ])
    expect(chat.nextId).toBe(3)
  })

  test('historyTurns repareia visitante e assistente e apara o texto', () => {
    const chat = addMessage(
      addMessage(emptyDemoChat(answers), 'assistant', ' Ola! '),
      'visitor',
      ' Oi '
    )

    expect(historyTurns(chat.messages)).toEqual([
      { role: 'assistant', text: 'Ola!' },
      { role: 'customer', text: 'Oi' }
    ])
  })

  test('joinTurns anexa a pergunta do visitante e a resposta da assistente', () => {
    const chat = joinTurns(emptyDemoChat(answers), 'Oi', 'Ola!')

    expect(chat.messages).toEqual([
      { id: 1, role: 'visitor', text: 'Oi' },
      { id: 2, role: 'assistant', text: 'Ola!' }
    ])
    expect(chat.nextId).toBe(3)
  })

  test('demoIsFull so conta as falas do visitante', () => {
    let chat = emptyDemoChat(answers)
    for (let index = 0; index < MAX_DEMO_EXCHANGES; index += 1) {
      chat = addMessage(chat, 'assistant', `resposta ${index}`)
    }
    expect(demoIsFull(chat)).toBe(false)

    for (let index = 0; index < MAX_DEMO_EXCHANGES - 1; index += 1) {
      chat = joinTurns(chat, `pergunta ${index}`, `resposta ${index}`)
    }
    expect(demoIsFull(chat)).toBe(false)

    chat = joinTurns(chat, 'ultima', 'fim')
    expect(demoIsFull(chat)).toBe(true)
  })

  test('MAX_DEMO_EXCHANGES fica em 8 trocas', () => {
    expect(MAX_DEMO_EXCHANGES).toBe(8)
  })
})
