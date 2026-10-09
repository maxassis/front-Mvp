/**
 * Linha crua de `authClient.subscription.list` — nomes confirmados nos tipos
 * instalados de @better-auth/stripe@1.6.27. `status` e a uniao do plugin e
 * `periodEnd` chega como Date no tipo, mas serializa para string no JSON do
 * HTTP, entao aqui os dois formatos sao aceitos.
 */
export interface SubscriptionRow {
  cancelAtPeriodEnd?: boolean | null
  id: string
  periodEnd?: string | Date | null
  plan: string
  status: string
}

export type SubscriptionStatus = 'active' | 'trialing'

export interface ActiveSubscription {
  cancelAtPeriodEnd: boolean
  id: string
  periodEnd: string | null
  plan: string
  status: SubscriptionStatus
}

const isActiveStatus = (status: string): status is SubscriptionStatus =>
  status === 'active' || status === 'trialing'

const periodEndMs = (row: SubscriptionRow): number => {
  if (!row.periodEnd) {
    return Number.NEGATIVE_INFINITY
  }
  const ms = new Date(row.periodEnd).getTime()
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms
}

const toIsoOrNull = (value: string | Date | null | undefined): string | null => {
  if (!value) {
    return null
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const selectActiveSubscription = (rows: SubscriptionRow[]): ActiveSubscription | null => {
  let winner: SubscriptionRow | null = null

  for (const row of rows) {
    if (!isActiveStatus(row.status)) {
      continue
    }
    if (!winner || periodEndMs(row) > periodEndMs(winner)) {
      winner = row
    }
  }

  if (!winner || !isActiveStatus(winner.status)) {
    return null
  }

  return {
    cancelAtPeriodEnd: winner.cancelAtPeriodEnd ?? false,
    id: winner.id,
    periodEnd: toIsoOrNull(winner.periodEnd),
    plan: winner.plan,
    status: winner.status
  }
}
