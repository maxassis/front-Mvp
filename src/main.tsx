import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { queryClient } from './lib/query-client'
import { createAppRouter } from './router'
import './index.css'

const rootElement = document.querySelector('#root')
if (!rootElement) {
  throw new Error('Elemento #root nao encontrado no index.html')
}

const router = createAppRouter(queryClient)

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
