import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth-client'
import { absoluteUrl, checkoutUrls } from './checkout'
import { billingError } from './errors'
import type { PaidPlan } from './plan-catalog'

export interface StartCheckoutInput {
  plan: PaidPlan
}

const notifyError = (error: Error): void => {
  toast.error(error.message)
}

/**
 * Abre o Checkout do Stripe para o plano escolhido. O plugin ja navega por
 * padrao (`disableRedirect` = false); o fallback cobre o caso em que a
 * navegacao automatica nao aconteceu mas a URL veio.
 */
export const useStartCheckout = () =>
  useMutation({
    mutationFn: async (input: StartCheckoutInput): Promise<void> => {
      const { data, error } = await authClient.subscription.upgrade({
        plan: input.plan.slug,
        ...checkoutUrls()
      })

      if (error) {
        throw billingError(error)
      }

      if (data?.redirect === false && data.url) {
        window.location.assign(data.url)
      }
    },
    onError: notifyError
  })

export const useOpenBillingPortal = () =>
  useMutation({
    mutationFn: async (): Promise<void> => {
      const { data, error } = await authClient.subscription.billingPortal({
        returnUrl: absoluteUrl('/plano')
      })

      if (error) {
        throw billingError(error)
      }

      if (data?.redirect === false && data.url) {
        window.location.assign(data.url)
      }
    },
    onError: notifyError
  })
