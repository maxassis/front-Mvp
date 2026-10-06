import { afterAll, describe, expect, it, mock } from 'bun:test'

import type { ConversationChanged } from './types'
import * as clientModule from './client'
import * as typesModule from './types'

// Bun so enxerga `paths` no tsconfig raiz, que nao tem, entao o alias do app
// nao resolve em `bun test`. O mock aponta o alias para o modulo real desta
// pasta: sem ele o `./events` (que importa os dois por alias) nao carrega.
mock.module('@/api/client', () => clientModule)
mock.module('@/api/types', () => typesModule)

const { openRealtimeEvents } = await import('./events')

const encoder = new TextEncoder()

/** Bun tipa `fetch` com `preconnect`, que um stub de teste nao implementa. */
const stubFetch = (
  handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
) => Object.assign(handler, { preconnect: () => {} }) as unknown as typeof fetch

interface SseTestStream {
  close: () => void
  response: Response
  send: (chunk: string) => void
}

const openSseStream = (): SseTestStream => {
  let source!: ReadableStreamDefaultController<Uint8Array>
  const stream = new ReadableStream<Uint8Array>({
    start: (controller) => {
      source = controller
    }
  })
  return {
    close: () => source.close(),
    response: new Response(stream, { status: 200 }),
    send: (chunk) => source.enqueue(encoder.encode(chunk))
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const waitFor = async (check: () => boolean, attempts = 200): Promise<void> => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (check()) {
      return
    }
    await sleep(5)
  }
  throw new Error('condicao nao alcancada a tempo')
}

const validEvent: ConversationChanged = {
  at: '2026-10-05T12:00:00Z',
  conversationId: 'conv-1',
  direction: 'inbound',
  id: 'convo-1',
  instanceId: 'inst-1',
  kind: 'conversation.changed',
  messageId: 'msg-9'
}

const changedFrame = (data: string): string =>
  `event: conversation.changed\ndata: ${data}\n\n`

const collect = () => {
  const received: ConversationChanged[] = []
  let readyCount = 0
  return {
    get readyCount() {
      return readyCount
    },
    handlers: {
      onConversationChanged: (event: ConversationChanged) => received.push(event),
      onReady: () => {
        readyCount += 1
      }
    },
    received
  }
}

describe('openRealtimeEvents', () => {
  const originalFetch = globalThis.fetch

  afterAll(() => {
    globalThis.fetch = originalFetch
  })

  it('entrega o frame conversation.changed parseado', async () => {
    const sse = openSseStream()
    globalThis.fetch = stubFetch(async () => sse.response)

    const collector = collect()
    const cancel = openRealtimeEvents(collector.handlers)

    sse.send(changedFrame(JSON.stringify(validEvent)))
    await waitFor(() => collector.received.length === 1)

    expect(collector.received).toEqual([validEvent])
    cancel()
    sse.close()
  })

  it('derruba payload malformado sem quebrar a leitura', async () => {
    const sse = openSseStream()
    globalThis.fetch = stubFetch(async () => sse.response)

    const collector = collect()
    const cancel = openRealtimeEvents(collector.handlers)

    sse.send(changedFrame('{lixo'))
    sse.send(changedFrame('{"kind":"conversation.changed"}'))
    await sleep(30)
    expect(collector.received).toEqual([])

    // O stream continua vivo depois dos frames ruins.
    sse.send(changedFrame(JSON.stringify(validEvent)))
    await waitFor(() => collector.received.length === 1)
    expect(collector.received).toEqual([validEvent])

    cancel()
    sse.close()
  })

  it('ignora o heartbeat de comentario em silencio', async () => {
    const sse = openSseStream()
    globalThis.fetch = stubFetch(async () => sse.response)

    const collector = collect()
    const cancel = openRealtimeEvents(collector.handlers)

    sse.send(': ping\n\n')
    sse.send(': ping\n\n')
    await sleep(30)
    expect(collector.received).toEqual([])
    expect(collector.readyCount).toBe(0)

    sse.send(changedFrame(JSON.stringify(validEvent)))
    await waitFor(() => collector.received.length === 1)

    cancel()
    sse.close()
  })

  it('ready dispara o flush de recuperacao', async () => {
    const sse = openSseStream()
    globalThis.fetch = stubFetch(async () => sse.response)

    const collector = collect()
    const cancel = openRealtimeEvents(collector.handlers)

    sse.send('event: ready\ndata: {}\n\n')
    await waitFor(() => collector.readyCount === 1)

    expect(collector.readyCount).toBe(1)
    expect(collector.received).toEqual([])
    cancel()
    sse.close()
  })

  it('cancel e idempotente e aborta uma vez so', async () => {
    const sse = openSseStream()
    let fetchCalls = 0
    let aborts = 0
    let signal: AbortSignal | null = null

    globalThis.fetch = stubFetch(async (_input, init) => {
      fetchCalls += 1
      signal = init?.signal ?? null
      signal?.addEventListener('abort', () => {
        aborts += 1
      })
      return sse.response
    })

    const collector = collect()
    const cancel = openRealtimeEvents(collector.handlers)
    await waitFor(() => fetchCalls === 1)

    cancel()
    cancel()

    // Leitura em funcao: no corpo do teste o TS ficaria preso no null do
    // initializer e marcaria `aborted` como propriedade de never.
    const streamSignal = (): AbortSignal | null => signal
    expect(streamSignal()).not.toBeNull()
    expect(streamSignal()?.aborted).toBe(true)
    expect(aborts).toBe(1)
    expect(fetchCalls).toBe(1)
    sse.close()
  })

  it('reconecta depois que o stream cai', async () => {
    const sse = openSseStream()
    let fetchCalls = 0
    globalThis.fetch = stubFetch(async () => {
      fetchCalls += 1
      // A segunda conexao fica aberta ate o cancel, senao o loop de novo cai
      // geraria reconexao em cascata dentro do teste.
      return fetchCalls === 1
        ? sse.response
        : new Response(new ReadableStream<Uint8Array>({ start: () => {} }), { status: 200 })
    })

    const collector = collect()
    const cancel = openRealtimeEvents(collector.handlers)
    await waitFor(() => fetchCalls === 1)

    sse.close()
    await waitFor(() => fetchCalls === 2, 600)

    expect(fetchCalls).toBe(2)
    cancel()
  })
})
