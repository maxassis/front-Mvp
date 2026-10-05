import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { sessionQuery } from '@/features/auth/queries'

/**
 * Layout do cadastro. `/register` e `/register/verify` sao duas telas do mesmo
 * passo, entao o guard e o redirecionamento moram aqui e as duas rotas filhas
 * so desenham o formulario delas.
 */
export const Route = createFileRoute('/register')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: Outlet
})