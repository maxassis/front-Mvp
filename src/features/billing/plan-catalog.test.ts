import { describe, expect, it } from 'bun:test'

import type { BillingPlan } from '@/api/types'
import { isPaidPlan, paidPlans, resolvePaidPlan } from './plan-catalog'

const plan = (overrides: Partial<BillingPlan> = {}): BillingPlan => ({
  createdAt: '2026-01-01T00:00:00.000Z',
  id: 'plan-id',
  monthlyMessageLimit: 300,
  name: 'Free',
  slug: 'free',
  stripeAnnualPriceId: null,
  stripeMeteredPriceId: null,
  stripePriceId: null,
  trialDays: 0,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides
})

const free = plan()
const standart = plan({
  id: 'std',
  monthlyMessageLimit: 10_000,
  name: 'Standart',
  slug: 'standart',
  stripePriceId: 'price_std_month'
})
const pro = plan({
  id: 'pro',
  monthlyMessageLimit: 50_000,
  name: 'Pro',
  slug: 'pro',
  stripePriceId: 'price_pro_month'
})

describe('paidPlans', () => {
  it('mantem so os planos com preco Stripe', () => {
    expect(paidPlans([free, standart, pro]).map((item) => item.slug)).toEqual(['standart', 'pro'])
  })

  it('nao considera pago um plano sem priceId', () => {
    expect(isPaidPlan(free)).toBe(false)
    expect(isPaidPlan(standart)).toBe(true)
  })
})

describe('resolvePaidPlan', () => {
  it('casa ignorando caixa e espaco', () => {
    expect(resolvePaidPlan([free, standart, pro], '  PRO ')?.slug).toBe('pro')
  })

  it('devolve null para slug desconhecido', () => {
    expect(resolvePaidPlan([free, standart, pro], 'enterprise')).toBeNull()
  })

  it('devolve null para o slug free', () => {
    expect(resolvePaidPlan([free, standart, pro], 'free')).toBeNull()
  })

  it('devolve null para vazio ou ausente', () => {
    expect(resolvePaidPlan([free, standart, pro], undefined)).toBeNull()
    expect(resolvePaidPlan([free, standart, pro], '   ')).toBeNull()
  })
})
