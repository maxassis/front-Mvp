import type { BillingPlan } from '@/api/types'

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
