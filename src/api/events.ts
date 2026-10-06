import { ApiError, apiStream } from '@/api/client'
import type { ConversationChanged } from '@/api/types'
import { conversationChangedSchema } from '@/api/types'

export interface RealtimeEventHandlers {
  /** Pode ter perdido eventos enquanto esteve fora: refaz as queries agora. */
  onReady: () => void
  onConversationChanged: (event: ConversationChanged) => void
}

const EVENTS_PATH = '/api/realtime/events'
const BACKOFF_FIRST_MS = 1_000
const BACKOFF_MAX_MS = 30_000

/** Quadro SSE ja fatiado: nome do evento e o data acumulado. */
interface SseFrame {
  data: string
  event: string
}

const parseFrame = (block: string): SseFrame | null => {
  let event = ''
  const dataLines: string[] = []

  for (const rawLine of block.split('\n')) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
    // O heartbeat chega como comentario (`: ping`): sem esse corte um frame de
    // comentario puro viraria evento vazio e cairia no dispatcher.
    if (line.startsWith(':')) {
      continue
    }
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
    if (field === 'event') {
      event = value
    }
    if (field === 'data') {
      dataLines.push(value)
    }
  }

  if (event === '' && dataLines.length === 0) {
    return null
  }
  return { data: dataLines.join('\n'), event }
}

const readConversationChanged = (data: string): ConversationChanged | null => {
  let payload: unknown
  try {
    payload = JSON.parse(data)
  } catch {
    // Quadro sem JSON valido segue o mesmo caminho do payload incompleto: some
    // sem derrubar a leitura do resto do stream.
    return null
  }

  const parsed = conversationChangedSchema.safeParse(payload)
  return parsed.success ? parsed.data : null
}

/**
 * Abre o stream de eventos em tempo real e devolve a funcao que cancela. Todo o
 * detalhe do SSE (URL, nomes de evento, parse, reconexao e abort) mora aqui;
 * para fora so chega frame ja validado.
 */
export const openRealtimeEvents = (handlers: RealtimeEventHandlers): (() => void) => {
  const controller = new AbortController()
  let cancelled = false
  let backoff = BACKOFF_FIRST_MS
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const dispatch = (frame: SseFrame): void => {
    if (frame.event === 'ready') {
      // `ready` chega em toda (re)conexao: prova de que a conexao subiu, entao
      // o backoff recomeca do minimo, e o recado de que eventos podem ter sido
      // perdidos, que o app trata como refetch imediato.
      backoff = BACKOFF_FIRST_MS
      handlers.onReady()
      return
    }
    if (frame.event !== 'conversation.changed') {
      return
    }

    const event = readConversationChanged(frame.data)
    if (event !== null) {
      handlers.onConversationChanged(event)
    }
  }

  const scheduleRetry = (): void => {
    if (cancelled || retryTimer !== null) {
      return
    }
    const delay = backoff
    backoff = Math.min(backoff * 2, BACKOFF_MAX_MS)
    retryTimer = setTimeout(() => {
      retryTimer = null
      void connect()
    }, delay)
  }

  const pump = async (body: ReadableStream<Uint8Array>): Promise<void> => {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        return
      }
      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        if (cancelled) {
          return
        }
        const frame = parseFrame(block)
        if (frame !== null) {
          dispatch(frame)
        }
      }
    }
  }

  const connect = async (): Promise<void> => {
    if (cancelled) {
      return
    }

    let response: Response
    try {
      response = await apiStream(EVENTS_PATH, {
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal
      })
    } catch (error) {
      // Sessao morta nao reconecta: o handler global ja leva para o login e a
      // rota de leads desmonta, cancelando o stream. Os demais erros (rede,
      // 5xx) voltam com backoff.
      if (cancelled || (error instanceof ApiError && error.isUnauthorized)) {
        return
      }
      scheduleRetry()
      return
    }

    if (response.body === null) {
      scheduleRetry()
      return
    }

    try {
      await pump(response.body)
    } catch {
      // Fim abrupto do stream (rede ou abort). O caminho de baixo decide se
      // reconecta.
    }

    if (!cancelled) {
      scheduleRetry()
    }
  }

  void connect()

  return () => {
    if (cancelled) {
      return
    }
    cancelled = true
    if (retryTimer !== null) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    controller.abort()
  }
}
