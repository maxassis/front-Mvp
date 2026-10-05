import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // O polling das telas de chat e explicito por query; o resto nao repete
      // GET sem motivo.
      refetchOnWindowFocus: false,
      staleTime: 30_000
    }
  }
})

/** Frequencia do polling das telas de leads e conversa. */
export const CHAT_POLL_INTERVAL_MS = 5_000
