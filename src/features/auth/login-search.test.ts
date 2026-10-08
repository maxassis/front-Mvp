import { describe, expect, it } from 'bun:test'
import { createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import { validateLoginSearch } from './login-search'

// O Transitioner do TanStack Router, no mount, chama buildLocation com
// `_includeValidateSearch: true` e faz commitLocation({ replace: true }) quando
// o href montado diverge do href atual. Um validador que devolve `error: null`
// faz o stringify gerar `?error=null`, e o reload em /login reescrevia a URL sem
// o usuario ter pedido nada. O teste monta um router de memoria com o validador
// real e le o href que o Transitioner escreveria.
const hrefAfterLoad = (initialEntry: string): string => {
  const rootRoute = createRootRoute()
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    validateSearch: validateLoginSearch
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([loginRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] })
  })

  const location = router.latestLocation
  return router.buildLocation({
    to: location.pathname,
    hash: true,
    params: true,
    search: true,
    state: true,
    _includeValidateSearch: true
  }).publicHref
}

describe('validateLoginSearch', () => {
  it('omite a chave error quando o valor nao e string', () => {
    expect(validateLoginSearch({})).toEqual({})
    expect(validateLoginSearch({ error: null })).toEqual({})
    expect(validateLoginSearch({ error: 42 })).toEqual({})
  })

  it('preserva o erro de callback do OAuth', () => {
    expect(validateLoginSearch({ error: 'state_invalid' })).toEqual({ error: 'state_invalid' })
  })

  it('nao escreve query no reload sem erro de callback', () => {
    expect(hrefAfterLoad('/login')).toBe('/login')
  })

  it('mantem o erro de callback na URL quando o OAuth volta com ele', () => {
    expect(hrefAfterLoad('/login?error=state_mismatch')).toBe('/login?error=state_mismatch')
    expect(hrefAfterLoad('/login?error=state_security_mismatch')).toBe(
      '/login?error=state_security_mismatch'
    )
  })
})
