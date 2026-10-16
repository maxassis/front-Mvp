import { describe, expect, it } from 'bun:test'
import { createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import { validatePasswordResetSearch } from './password-reset-search'

const hrefAfterLoad = (initialEntry: string): string => {
  const rootRoute = createRootRoute()
  const verifyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/forgot-password/verify',
    validateSearch: validatePasswordResetSearch
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([verifyRoute]),
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

describe('validatePasswordResetSearch', () => {
  it('preserva o email quando ele vem como string', () => {
    expect(validatePasswordResetSearch({ email: 'ana@exemplo.com' })).toEqual({
      email: 'ana@exemplo.com'
    })
  })

  it('devolve email vazio quando ausente ou de outro tipo', () => {
    expect(validatePasswordResetSearch({})).toEqual({ email: '' })
    expect(validatePasswordResetSearch({ email: null })).toEqual({ email: '' })
    expect(validatePasswordResetSearch({ email: 42 })).toEqual({ email: '' })
  })

  it('mantem o email na URL no reload do passo de confirmacao', () => {
    expect(hrefAfterLoad('/forgot-password/verify?email=ana@exemplo.com')).toContain(
      'email=ana%40exemplo.com'
    )
  })

  // O validador sempre devolve a chave `email`, entao sem email na entrada ela
  // vira `?email=` na URL. E o mesmo formato de /register/verify; o campo segue
  // editavel porque a chave chega vazia.
  it('escreve email vazio na URL quando ele nao veio', () => {
    expect(hrefAfterLoad('/forgot-password/verify')).toBe('/forgot-password/verify?email=')
  })
})
