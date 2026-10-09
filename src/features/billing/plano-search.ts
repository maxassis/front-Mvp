export const CHECKOUT_STATUSES = ['sucesso', 'cancelado'] as const
export type CheckoutStatus = (typeof CHECKOUT_STATUSES)[number]

export interface PlanSearch {
  plan?: string
  status?: CheckoutStatus
}

/**
 * Validador compartilhado de `validateSearch` das rotas /checkout e /plano.
 *
 * A chave so entra quando o valor e o esperado; nunca emitimos `plan:
 * undefined`. O Transitioner do TanStack Router, no mount, faz commitLocation
 * quando o href montado diverge do atual e serializa `undefined` como a string
 * "undefined", reescrevendo a URL com `?plan=undefined` sem o usuario pedir
 * (mesmo hazard documentado em features/auth/login-search.ts).
 *
 * Vive fora das rotas porque `bun test` nao resolve o alias `@/`.
 */
export const parsePlanSearch = (search: Record<string, unknown>): PlanSearch => {
  const result: PlanSearch = {}

  if (typeof search.plan === 'string' && search.plan.length > 0) {
    result.plan = search.plan
  }

  if (search.status === 'sucesso' || search.status === 'cancelado') {
    result.status = search.status
  }

  return result
}

export const validatePlanSearch = parsePlanSearch
