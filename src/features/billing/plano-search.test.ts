import { describe, expect, it } from 'bun:test'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter
} from '@tanstack/react-router'

import { parsePlanSearch, validatePlanSearch } from './plano-search'

// Mesmo hazard do login-search: no mount o Transitioner chama buildLocation com
// `_includeValidateSearch: true` e reescreve a URL quando o href montado diverge
// do atual. Um validador que emite `plan: undefined` vira `?plan=undefined`.
const hrefAfterLoad = (initialEntry: string, path: '/plano' | '/checkout'): string => {
  const rootRoute = createRootRoute()
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path,
    validateSearch: validatePlanSearch
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
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

describe('parsePlanSearch', () => {
  it('omite as chaves quando o valor nao serve', () => {
    expect(parsePlanSearch({})).toEqual({})
    expect(parsePlanSearch({ plan: undefined })).toEqual({})
    expect(parsePlanSearch({ plan: null })).toEqual({})
    expect(parsePlanSearch({ plan: 42 })).toEqual({})
    expect(parsePlanSearch({ status: 'pago' })).toEqual({})
  })

  it('preserva plan e status validos', () => {
    expect(parsePlanSearch({ plan: 'pro' })).toEqual({ plan: 'pro' })
    expect(parsePlanSearch({ status: 'sucesso' })).toEqual({ status: 'sucesso' })
    expect(parsePlanSearch({ plan: 'pro', status: 'cancelado' })).toEqual({
      plan: 'pro',
      status: 'cancelado'
    })
  })

  it('nao emite a chave plan como undefined', () => {
    const result = parsePlanSearch({ status: 'sucesso' })
    expect('plan' in result).toBe(false)
  })
})

describe('validatePlanSearch no router', () => {
  it('/plano sem status nao ganha query no reload', () => {
    expect(hrefAfterLoad('/plano', '/plano')).toBe('/plano')
  })

  it('/plano com status valido mantem a query', () => {
    expect(hrefAfterLoad('/plano?status=sucesso', '/plano')).toBe('/plano?status=sucesso')
  })

  it('/checkout sem plan nao vira ?plan=undefined', () => {
    expect(hrefAfterLoad('/checkout', '/checkout')).toBe('/checkout')
  })

  it('/checkout mantem o plan valido', () => {
    expect(hrefAfterLoad('/checkout?plan=pro', '/checkout')).toBe('/checkout?plan=pro')
  })
})
