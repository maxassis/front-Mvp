import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, mock, spyOn } from 'bun:test'
import { z } from 'zod'

import type { RealtimeEventHandlers } from '@/api/events'
import type { ConversationChanged } from '@/api/types'

// Bun so enxerga `paths` no tsconfig raiz, que nao tem, entao o alias do app
// nao resolve em `bun test`. Os mocks cobrem os tres aliases desta cadeia:
// dublas minimos para o que `./queries` carrega no import (nenhuma query roda
// aqui) e a captura do stream, para o teste disparar os eventos na mao.
mock.module('@/api/client', () => ({
  api: { get: () => Promise.resolve([]) },
  buildUrl: (path: string) => path
}))
mock.module('@/api/types', () => ({
  leadMessageSchema: z.object({}),
  leadSchema: z.object({})
}))

const queriesModule = await import('./queries')
mock.module('@/features/leads/queries', () => queriesModule)

let streamHandlers: RealtimeEventHandlers | null = null
mock.module('@/api/events', () => ({
  openRealtimeEvents: (handlers: RealtimeEventHandlers) => {
    streamHandlers = handlers
    return () => {
      streamHandlers = null
    }
  }
}))

const { startLeadsRealtime } = await import('./use-leads-realtime')

const currentHandlers = (): RealtimeEventHandlers => {
  if (streamHandlers === null) {
    throw new Error('stream de eventos nao abriu')
  }
  return streamHandlers
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const validEvent: ConversationChanged = {
  at: '2026-10-05T12:00:00Z',
  conversationId: 'conv-1',
  direction: 'inbound',
  id: 'convo-1',
  instanceId: 'inst-1',
  kind: 'conversation.changed',
  messageId: 'msg-9'
}

describe('startLeadsRealtime', () => {
  it('agrupa uma rajada de eventos em uma invalidacao so', async () => {
    const queryClient = new QueryClient()
    const invalidate = spyOn(queryClient, 'invalidateQueries')
    const stop = startLeadsRealtime(queryClient)
    const handlers = currentHandlers()

    for (let burst = 0; burst < 5; burst += 1) {
      handlers.onConversationChanged(validEvent)
    }
    await sleep(250)

    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['leads'] })
    stop()
  })

  it('ready invalida na hora, sem esperar a rajada', async () => {
    const queryClient = new QueryClient()
    const invalidate = spyOn(queryClient, 'invalidateQueries')
    const stop = startLeadsRealtime(queryClient)
    const handlers = currentHandlers()

    handlers.onReady()
    await sleep(30)

    expect(invalidate).toHaveBeenCalledTimes(1)
    stop()
  })

  it('parar o stream cancela a rajada pendente', async () => {
    const queryClient = new QueryClient()
    const invalidate = spyOn(queryClient, 'invalidateQueries')
    const stop = startLeadsRealtime(queryClient)
    const handlers = currentHandlers()

    handlers.onConversationChanged(validEvent)
    stop()
    await sleep(250)

    expect(invalidate).not.toHaveBeenCalled()
  })
})
