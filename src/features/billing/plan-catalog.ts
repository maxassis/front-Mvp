import type { BillingPlan } from '@/api/types'
import type { ActiveSubscription } from './subscription'

export type PaidPlan = BillingPlan & { stripePriceId: string }

export const isPaidPlan = (plan: BillingPlan): plan is PaidPlan => plan.stripePriceId !== null

export const paidPlans = (plans: BillingPlan[]): PaidPlan[] => plans.filter(isPaidPlan)

export const resolvePaidPlan = (
  plans: BillingPlan[],
  slug: string | undefined
): PaidPlan | null => {
  const needle = slug?.trim().toLowerCase()
  if (!needle) {
    return null
  }

  const match = plans.find((plan) => plan.slug.trim().toLowerCase() === needle)
  return match && isPaidPlan(match) ? match : null
}

export const isCurrentPlan = (
  plan: BillingPlan,
  active: ActiveSubscription | null
): boolean => {
  if (!active) {
    return false
  }
  return plan.slug.trim().toLowerCase() === active.plan.trim().toLowerCase()
}

export type PlanDirection = 'downgrade' | 'unknown' | 'upgrade'

export const planDirection = (
  plans: BillingPlan[],
  active: ActiveSubscription | null,
  target: BillingPlan
): PlanDirection => {
  if (!active || isCurrentPlan(target, active)) {
    return 'unknown'
  }

  const current = plans.find(
    (plan) => plan.slug.trim().toLowerCase() === active.plan.trim().toLowerCase()
  )
  if (!current) {
    return 'unknown'
  }

  if (target.monthlyMessageLimit < current.monthlyMessageLimit) {
    return 'downgrade'
  }
  if (target.monthlyMessageLimit > current.monthlyMessageLimit) {
    return 'upgrade'
  }
  return 'unknown'
}
