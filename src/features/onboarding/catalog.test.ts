import { describe, expect, it } from 'bun:test'

import {
  agendaOptionalFieldKeys,
  agendaRequiredFieldKeys,
  catalogEntries,
  entryByFieldKey,
  requiredFieldKeys,
  toneOfVoiceOptions
} from './catalog'

/**
 * O backend nao expoe o catalogo por endpoint, entao a paridade com a
 * whitelist `BEHAVIORAL_FIELD_KEYS` e travada aqui: qualquer chave nova,
 * removida ou com obrigatoriedade trocada no service quebra este teste e
 * obriga a atualizar label, pergunta e categoria junto.
 */
const readBackendKeys = async (arrayName: string): Promise<string[]> => {
  const fallback = `${import.meta.dir}/../../../../elysia-rag-api/apps/backend/src/modules/onboarding/onboarding.service.ts`
  const path = process.env.ONBOARDING_SERVICE_PATH ?? fallback
  const source = await Bun.file(path)
    .text()
    .catch(() => {
      throw new Error(
        `Nao foi possivel ler o service do backend em ${path}. ` +
          'Aponte ONBOARDING_SERVICE_PATH para onboarding.service.ts.'
      )
    })

  const block = source.match(new RegExp(`${arrayName} = \\[([\\s\\S]*?)\\]`))?.[1]
  if (!block) {
    throw new Error(`Array ${arrayName} nao encontrado em ${path}`)
  }
  return [...block.matchAll(/'([a-z_]+)'/g)].map((match) => match[1] ?? '')
}

describe('catalogEntries', () => {
  it('traz as 51 chaves sem duplicar fieldKey', () => {
    const keys = catalogEntries.map((entry) => entry.fieldKey)
    expect(keys).toHaveLength(51)
    expect(new Set(keys).size).toBe(51)
  })

  it('numera sortOrder em sequencia de 10', () => {
    expect(catalogEntries.map((entry) => entry.sortOrder)).toEqual(
      catalogEntries.map((_, index) => (index + 1) * 10)
    )
  })

  it('marca exatamente as 5 obrigatorias', () => {
    expect([...requiredFieldKeys].sort()).toEqual(
      [
        'assistant_goal',
        'assistant_persona',
        'qualification_flow',
        'tone_of_voice',
        'unknown_information_policy'
      ].sort()
    )
  })

  it('marca os 4 de agenda e 1 opcional de agenda', () => {
    expect([...agendaRequiredFieldKeys].sort()).toEqual(
      ['available_professionals', 'booking_lead_time', 'scheduling_policy', 'working_hours'].sort()
    )
    expect(agendaOptionalFieldKeys).toEqual(['cancellation_policy'])
  })

  it('acha entrada por fieldKey e devolve undefined no desconhecido', () => {
    expect(entryByFieldKey('tone_of_voice')?.label).toBe('Tom de voz')
    expect(entryByFieldKey('handoff_information')).toBeUndefined()
  })

  it('oferece os tons de voz do formulario', () => {
    expect(toneOfVoiceOptions).toContain('Profissional')
  })
})

describe('paridade com o backend', () => {
  it('cobre exatamente a whitelist, sem chave a mais nem a menos', async () => {
    const backend = await readBackendKeys('BEHAVIORAL_FIELD_KEYS')
    const catalog = catalogEntries.map((entry) => entry.fieldKey)
    expect([...catalog].sort()).toEqual([...backend].sort())
  })

  it('acompanha a obrigatoriedade do service', async () => {
    const [required, agendaRequired] = await Promise.all([
      readBackendKeys('REQUIRED_FIELD_KEYS'),
      readBackendKeys('REQUIRED_AGENDA_FIELD_KEYS')
    ])
    expect([...requiredFieldKeys].sort()).toEqual([...required].sort())
    expect([...agendaRequiredFieldKeys].sort()).toEqual([...agendaRequired].sort())
  })
})
