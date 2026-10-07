import { describe, expect, it } from 'bun:test'

import type { AnsweredField } from './onboarding-state'
import { isLockedField, normalizeSearch, onboardingState } from './onboarding-state'
import { entryByFieldKey } from './catalog'

const answered = (fieldKey: string, answer = 'resposta'): AnsweredField => ({
  answer,
  enabled: true,
  fieldKey
})

const allRequired: AnsweredField[] = [
  'assistant_goal',
  'qualification_flow',
  'assistant_persona',
  'tone_of_voice',
  'unknown_information_policy'
].map((fieldKey) => answered(fieldKey))

describe('normalizeSearch', () => {
  it('remove acento, caixa e espaco para a busca casar', () => {
    expect(normalizeSearch('  Entrega Rápida ')).toBe('entrega rapida')
  })
})

describe('onboardingState', () => {
  it('pede as 5 obrigatorias e trava opcionais no comeco', () => {
    const state = onboardingState(false, [], '')
    expect(state.pendingRequired.map((entry) => entry.fieldKey).sort()).toEqual(
      [
        'assistant_goal',
        'assistant_persona',
        'qualification_flow',
        'tone_of_voice',
        'unknown_information_policy'
      ].sort()
    )
    expect(state.canAddOptional).toBe(false)
  })

  it('libera opcionais quando as 5 estao respondidas e ativas', () => {
    const state = onboardingState(false, allRequired, '')
    expect(state.pendingRequired).toEqual([])
    expect(state.canAddOptional).toBe(true)
  })

  it('trata obrigatoria desativada ou vazia como pendente', () => {
    const disabled = allRequired.map((item) =>
      item.fieldKey === 'tone_of_voice' ? { ...item, enabled: false } : item
    )
    expect(onboardingState(false, disabled, '').canAddOptional).toBe(false)

    const blank = allRequired.map((item) =>
      item.fieldKey === 'tone_of_voice' ? { ...item, answer: '  ' } : item
    )
    const state = onboardingState(false, blank, '')
    expect(state.pendingRequired.map((entry) => entry.fieldKey)).toEqual(['tone_of_voice'])
  })

  it('exige os 4 de agenda quando a agenda esta ligada', () => {
    const state = onboardingState(true, allRequired, '')
    expect(state.pendingRequired.map((entry) => entry.fieldKey).sort()).toEqual(
      ['available_professionals', 'booking_lead_time', 'scheduling_policy', 'working_hours'].sort()
    )
    expect(state.canAddOptional).toBe(false)
  })

  it('esconde campos de agenda quando a agenda esta desligada', () => {
    const state = onboardingState(false, allRequired, '')
    expect(state.availableCount).toBeGreaterThan(0)
    const keys = state.availableGroups.flatMap((group) => group.entries.map((entry) => entry.fieldKey))
    expect(keys).not.toContain('scheduling_policy')
    expect(keys).not.toContain('cancellation_policy')
  })

  it('tira do catalogo o que ja foi salvo e ordena salvos por sortOrder', () => {
    const state = onboardingState(false, [answered('tone_of_voice'), answered('assistant_goal')], '')
    const keys = state.availableGroups.flatMap((group) => group.entries.map((entry) => entry.fieldKey))
    expect(keys).not.toContain('tone_of_voice')
    expect(state.savedEntries.map((saved) => saved.entry.fieldKey)).toEqual([
      'assistant_goal',
      'tone_of_voice'
    ])
  })

  it('ignora item salvo com chave fora do catalogo', () => {
    const state = onboardingState(false, [...allRequired, answered('human_handoff')], '')
    expect(state.savedEntries).toHaveLength(5)
    expect(state.canAddOptional).toBe(true)
  })

  it('filtra o catalogo pela busca em rotulo, pergunta, chave e categoria', () => {
    const state = onboardingState(false, allRequired, 'orcamento')
    const keys = state.availableGroups.flatMap((group) => group.entries.map((entry) => entry.fieldKey))
    expect(keys).toContain('budget_qualification')
    expect(keys).toContain('quote_rules')
    expect(keys).not.toContain('emoji_policy')
  })
})

describe('isLockedField', () => {
  it('trava obrigatoria sempre e campo de agenda so com agenda ligada', () => {
    const required = entryByFieldKey('assistant_goal')
    const agenda = entryByFieldKey('scheduling_policy')
    const optional = entryByFieldKey('emoji_policy')
    if (!required || !agenda || !optional) {
      throw new Error('catalogo sem as chaves do teste')
    }
    expect(isLockedField(required, false)).toBe(true)
    expect(isLockedField(agenda, true)).toBe(true)
    expect(isLockedField(agenda, false)).toBe(false)
    expect(isLockedField(optional, true)).toBe(false)
  })
})
