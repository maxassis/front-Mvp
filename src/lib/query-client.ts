import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Sem polling automatico: leads e conversa atualizam por acao do
      // operador (botao Atualizar) ou por invalidacao apos mutacao.
      refetchOnWindowFocus: false,
      staleTime: 30_000
    }
  }
})
