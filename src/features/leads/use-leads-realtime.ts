import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { openRealtimeEvents } from '@/api/events'
import { leadKeys } from '@/features/leads/queries'

/**
 * Rajada de eventos vira uma invalidacao so: N mensagens que chegam juntas
 * nao viram N refetches, e o atraso deixa o commit do backend que gerou o
 * evento acontecer antes de a busca comecar.
 */
const COALESCE_MS = 150

/**
 * Liga o stream de eventos ao cache do TanStack Query. O evento e so aviso de
 * que algo mudou: o cache segue como unica fonte de verdade e a refetch
 * acontece pelas queries tipadas que ja existem, invalidadas pelo prefixo
 * `leadKeys.all` (lista e mensagens). Nada do payload entra no cache.
 *
 * Devolve a funcao que encerra tudo (stream + rajada pendente).
 */
export const startLeadsRealtime = (queryClient: QueryClient): (() => void) => {
  let dirty = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    dirty = false
    void queryClient.invalidateQueries({ queryKey: leadKeys.all })
  }

  const markDirty = (): void => {
    if (dirty) {
      return
    }
    dirty = true
    timer = setTimeout(flush, COALESCE_MS)
  }

  const cancel = openRealtimeEvents({
    // `ready` avisa que eventos podem ter sido perdidos enquanto o stream
    // caiu: nao espera a rajada, refaz na hora.
    onReady: flush,
    onConversationChanged: markDirty
  })

  return () => {
    cancel()
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    dirty = false
  }
}

export const useLeadsRealtime = (): void => {
  const queryClient = useQueryClient()
  useEffect(() => startLeadsRealtime(queryClient), [queryClient])
}
