/**
 * Estado derivado do onboarding em uma funcao pura. Substitui a logica
 * espalhada da referencia (listas paralelas de chaves, `isRequiredField`,
 * `canSaveSelection`, filtros encadeados no componente) por um unico calculo
 * testavel: a tela recebe o estado pronto e nao decide nada.
 *
 * Sem imports de `@/`: o input e estrutural (`AnsweredField`), entao
 * `OnboardingItem` real satisfaz por largura e o teste usa literais parciais.
 */

import type { CatalogEntry } from './catalog'
import { catalogEntries, entryByFieldKey } from './catalog'

export interface AnsweredField {
  answer: string | null
  enabled: boolean
  fieldKey: string
}

export interface CatalogGroup {
  category: string
  entries: CatalogEntry[]
}

export interface SavedEntry<T extends AnsweredField> {
  entry: CatalogEntry
  item: T
}

export interface OnboardingState<T extends AnsweredField = AnsweredField> {
  availableCount: number
  availableGroups: CatalogGroup[]
  canAddOptional: boolean
  pendingRequired: CatalogEntry[]
  savedEntries: SavedEntry<T>[]
}

export const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .trim()

const matchesSearch = (entry: CatalogEntry, search: string): boolean => {
  if (!search) {
    return true
  }
  return [entry.label, entry.question, entry.fieldKey, entry.category].some((value) =>
    normalizeSearch(value).includes(search)
  )
}

const isAgendaEntry = (entry: CatalogEntry): boolean =>
  entry.requirement === 'agenda-required' || entry.requirement === 'agenda-optional'

/**
 * O backend recusa com 400 desativar obrigatoria e desativar ou esvaziar campo
 * de agenda com a agenda ligada, entao a tela nem oferece essas acoes.
 */
export const isLockedField = (entry: CatalogEntry, agendaEnabled: boolean): boolean =>
  entry.requirement === 'required' ||
  (agendaEnabled && entry.requirement === 'agenda-required')

const isPending = (entry: CatalogEntry, item: AnsweredField | undefined): boolean => {
  if (entry.requirement !== 'required' && entry.requirement !== 'agenda-required') {
    return false
  }
  return !item?.enabled || !item.answer?.trim()
}

export const onboardingState = <T extends AnsweredField>(
  agendaEnabled: boolean,
  items: T[],
  search: string
): OnboardingState<T> => {
  const normalizedSearch = normalizeSearch(search)
  const byFieldKey = new Map(items.map((item) => [item.fieldKey, item]))

  const pendingRequired = catalogEntries.filter((entry) => {
    if (entry.requirement === 'agenda-required' && !agendaEnabled) {
      return false
    }
    return isPending(entry, byFieldKey.get(entry.fieldKey))
  })

  const savedEntries: SavedEntry<T>[] = []
  for (const item of items) {
    const entry = entryByFieldKey(item.fieldKey)
    if (entry) {
      savedEntries.push({ entry, item })
    }
  }
  savedEntries.sort((a, b) => a.entry.sortOrder - b.entry.sortOrder)

  const savedKeys = new Set(items.map((item) => item.fieldKey))
  const available = catalogEntries.filter(
    (entry) =>
      !savedKeys.has(entry.fieldKey) &&
      (agendaEnabled || !isAgendaEntry(entry)) &&
      matchesSearch(entry, normalizedSearch)
  )

  const availableGroups: CatalogGroup[] = []
  for (const entry of available) {
    const group = availableGroups.find((current) => current.category === entry.category)
    if (group) {
      group.entries.push(entry)
    } else {
      availableGroups.push({ category: entry.category, entries: [entry] })
    }
  }

  return {
    availableCount: available.length,
    availableGroups,
    canAddOptional: pendingRequired.length === 0,
    pendingRequired,
    savedEntries
  }
}
