import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { beginCheckoutHandoff, resetCheckoutHandoff } from '@/features/billing/checkout'
import { useStartCheckout } from '@/features/billing/mutations'
import { resolvePaidPlan } from '@/features/billing/plan-catalog'
import { validatePlanSearch } from '@/features/billing/plano-search'
import { plansQuery } from '@/features/billing/queries'

/**
 * A resolucao do plano acontece em beforeLoad, nao no componente: a mutacao
 * fica de fora do beforeLoad de proposito porque o `defaultPreload: 'intent'`
 * do router dispara o beforeLoad no hover do link e abriria o Stripe so por
 * passar o mouse. O componente so dispara depois do mount.
 */
export const Route = createFileRoute('/_authed/checkout')({
  beforeLoad: async ({ context, search }) => {
    const plans = await context.queryClient.ensureQueryData(plansQuery)
    const plan = resolvePaidPlan(plans, search.plan)

    if (!plan) {
      throw redirect({ search: {}, to: '/plano' })
    }

    return { plan }
  },
  component: CheckoutPage,
  validateSearch: validatePlanSearch
})

function CheckoutPage() {
  const { plan } = Route.useRouteContext()
  const router = useRouter()
  const upgrade = useStartCheckout()
  const [failed, setFailed] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    // O ref segura o double-mount do StrictMode; o latch de modulo segura o
    // disparo unico por carregamento de pagina, antes de qualquer await.
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    if (!beginCheckoutHandoff()) {
      return
    }

    const run = async () => {
      // Tira o intent do historico primeiro: Back ou refresh no /checkout nao
      // podem re-disparar o handoff nem a mutacao.
      await router.navigate({ replace: true, search: {}, to: '/plano' })
      try {
        await upgrade.mutateAsync({ plan })
      } catch (error) {
        resetCheckoutHandoff()
        setFailed(error instanceof Error ? error.message : 'Nao foi possivel abrir o Stripe.')
      }
    }

    void run()
  }, [plan, router, upgrade])

  if (failed) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col gap-4 p-6">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{failed}</AlertDescription>
        </Alert>
        <Button asChild className="self-start" variant="outline">
          <Link search={{}} to="/plano">
            Voltar para planos
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Abrindo o Stripe...</p>
    </div>
  )
}
