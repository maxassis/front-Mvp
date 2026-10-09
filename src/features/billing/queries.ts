import { queryOptions } from '@tanstack/react-query'

import { api } from '@/api/client'
import { billingPlanListSchema, billingUsageSchema } from '@/api/types'
import { authClient } from '@/lib/auth-client'
import { billingError } from './errors'
import { selectActiveSubscription } from './subscription'

export const billingKeys = {
  all: ['billing'] as const,
  plans: ['billing', 'plans'] as const,
  subscriptions: ['billing', 'subscriptions'] as const,
  usage: ['billing', 'usage'] as const
}

/** Catalogo publico e estavel: cache de 5 minutos evita rebater a cada visita. */
export const plansQuery = queryOptions({
  queryFn: () => api.get('/api/billing/plans', billingPlanListSchema),
  queryKey: billingKeys.plans,
  staleTime: 5 * 60_000
})

export const usageQuery = queryOptions({
  queryFn: () => api.get('/api/billing/usage', billingUsageSchema),
  queryKey: billingKeys.usage
})

export const subscriptionsQuery = queryOptions({
  queryFn: async () => {
    const { data, error } = await authClient.subscription.list()

    if (error) {
      throw billingError(error)
    }

    return selectActiveSubscription(data ?? [])
  },
  queryKey: billingKeys.subscriptions
})
