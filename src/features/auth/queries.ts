import { queryOptions } from '@tanstack/react-query'

import { authClient } from '@/lib/auth-client'

export const sessionKeys = {
  all: ['session'] as const
}

/**
 * Fonte unica do estado de autenticacao. O guard de rota le daqui via
 * `ensureQueryData`, entao nao existe estado "ainda nao sei se tem sessao" no
 * router: a navegacao espera a Promise e so entao decide o redirect.
 */
export const sessionQuery = queryOptions({
  queryFn: async () => {
    const { data } = await authClient.getSession()
    return data ?? null
  },
  queryKey: sessionKeys.all,
  staleTime: Number.POSITIVE_INFINITY
})
