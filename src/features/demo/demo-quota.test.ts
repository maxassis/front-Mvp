import { describe, expect, test } from 'bun:test'

import {
  exchangeLimitMessage,
  formatResetTime,
  quotaExhaustedMessage,
  quotaRenewalMessage,
  remainingMessagesLabel
} from './demo-quota'

/** Meia-noite de Brasilia (UTC-3): 2026-10-20T00:00-03:00. */
const MEIA_NOITE_BRASILIA = '2026-10-20T03:00:00.000Z'

describe('saldo diario do demo', () => {
  test('formatResetTime mostra a hora de Brasilia', () => {
    expect(formatResetTime(MEIA_NOITE_BRASILIA)).toBe('00:00')
    expect(formatResetTime('2026-10-20T15:30:00.000Z')).toBe('12:30')
  })

  test('formatResetTime nao quebra com data invalida', () => {
    expect(formatResetTime('nao-e-data')).toBe('00:00')
    expect(formatResetTime('')).toBe('00:00')
  })

  test('quotaExhaustedMessage avisa o gasto e a hora da renovacao', () => {
    expect(quotaExhaustedMessage(MEIA_NOITE_BRASILIA)).toBe(
      'Voce usou todas as mensagens de hoje. O saldo renova as 00:00 (horario de Brasilia).'
    )
  })

  test('quotaRenewalMessage devolve so a frase de renovacao', () => {
    expect(quotaRenewalMessage(MEIA_NOITE_BRASILIA)).toBe(
      'O saldo renova as 00:00 (horario de Brasilia).'
    )
  })

  test('exchangeLimitMessage cita o teto da conversa', () => {
    expect(exchangeLimitMessage()).toBe('Voce chegou ao limite de 8 perguntas desta conversa.')
  })

  test('remainingMessagesLabel mostra quantas mensagens sobram', () => {
    expect(remainingMessagesLabel(3)).toBe('Restam 3 mensagens hoje')
    expect(remainingMessagesLabel(0)).toBe('Restam 0 mensagens hoje')
  })
})
