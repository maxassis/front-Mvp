import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { sessionQuery } from '@/features/auth/queries'

/**
 * Layout da recuperacao de senha. `/forgot-password` e
 * `/forgot-password/verify` sao dois passos do mesmo fluxo, entao o guard e o
 * redirecionamento moram aqui e as rotas filhas so desenham o formulario delas.
 */
export const Route = createFileRoute('/forgot-password')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: Outlet
})
