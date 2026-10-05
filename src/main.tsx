import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { setUnauthorizedHandler } from './api/client'
import { sessionKeys } from './features/auth/queries'
import { queryClient } from './lib/query-client'
import { createAppRouter } from './router'
import './index.css'

const rootElement = document.querySelector('#root')
if (!rootElement) {
  throw new Error('Elemento #root nao encontrado no index.html')
}

const router = createAppRouter(queryClient)

// Cookie de sessao que morre no meio do uso nao passa pelo guard de rota, que so
// roda na navegacao. Zera o cache e leva para o login, senao a tela fica presa
// mostrando dado velho com um alerta de 401 e sem saida.
setUnauthorizedHandler(() => {
  if (queryClient.getQueryData(sessionKeys.all) === null) {
    return
  }
  queryClient.setQueryData(sessionKeys.all, null)
  queryClient.clear()
  void router.navigate({ to: '/login' })
})

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)