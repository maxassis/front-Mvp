import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { BillingPlan, BillingUsage } from '@/api/types'
import {
  CHECKOUT_SUCCESS_POLL_BUDGET_MS,
  checkoutSuccessPollMs
} from '@/features/billing/checkout'
import { useOpenBillingPortal } from '@/features/billing/mutations'
import { isPaidPlan, paidPlans } from '@/features/billing/plan-catalog'
import { validatePlanSearch } from '@/features/billing/plano-search'
import { billingKeys, plansQuery, subscriptionsQuery, usageQuery } from '@/features/billing/queries'
import type { ActiveSubscription } from '@/features/billing/subscription'

const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('pt-BR')

export const Route = createFileRoute('/_authed/plano')({
  component: PlanoPage,
  validateSearch: validatePlanSearch
})

function PlanoPage() {
  const { status } = Route.useSearch()
  const queryClient = useQueryClient()
  const startAtRef = useRef(Date.now())
  const invalidatedRef = useRef(false)
  const [pollExpired, setPollExpired] = useState(false)

  const plans = useQuery(plansQuery)
  const usage = useQuery(usageQuery)
  const subscriptions = useQuery({
    ...subscriptionsQuery,
    refetchInterval: (query) =>
      status === 'sucesso'
        ? checkoutSuccessPollMs(Date.now() - startAtRef.current, Boolean(query.state.data))
        : false
  })

  const active = subscriptions.data ?? null

  // Enquanto o poll corre, um timer local fecha o orcamento para a tela poder
  // trocar a copy e oferecer o botao manual sem depender de novo fetch.
  useEffect(() => {
    if (status !== 'sucesso' || active) {
      setPollExpired(false)
      return
    }

    const remaining = CHECKOUT_SUCCESS_POLL_BUDGET_MS - (Date.now() - startAtRef.current)
    if (remaining <= 0) {
      setPollExpired(true)
      return
    }

    const timer = setTimeout(() => setPollExpired(true), remaining)
    return () => clearTimeout(timer)
  }, [status, active])

  // O uso muda quando a assinatura nova aparece; invalida uma vez so.
  useEffect(() => {
    if (active && !invalidatedRef.current) {
      invalidatedRef.current = true
      void queryClient.invalidateQueries({ queryKey: billingKeys.usage })
    }
  }, [active, queryClient])

  const retry = () => {
    void plans.refetch()
    void usage.refetch()
    void subscriptions.refetch()
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-semibold">Plano e assinatura</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe seu uso e gerencie sua assinatura
        </p>
      </div>

      {status === 'sucesso' ? (
        <SuccessBanner active={active} pollExpired={pollExpired} />
      ) : null}

      {status === 'cancelado' ? (
        <Alert>
          <Info />
          <AlertDescription>Voce pode concluir o pagamento quando quiser.</AlertDescription>
        </Alert>
      ) : null}

      {subscriptions.isSuccess && !active ? (
        <Alert>
          <Info />
          <AlertDescription>
            Para conectar um numero, escolha um plano. 7 dias gratis, sem cobranca hoje.
          </AlertDescription>
        </Alert>
      ) : null}

      {status === 'sucesso' && !active && pollExpired ? (
        <Button className="self-start" onClick={retry} size="sm" variant="outline">
          Atualizar
        </Button>
      ) : null}

      <UsageCard usage={usage} />

      {active ? <ActiveSubscriptionCard active={active} /> : null}

      {plans.isError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            Nao foi possivel carregar os planos. {plans.error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {usage.isError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            Nao foi possivel carregar o uso. {usage.error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {subscriptions.isError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            Nao foi possivel carregar sua assinatura. {subscriptions.error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {plans.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((index) => (
            <Skeleton className="h-40 w-full" key={index} />
          ))}
        </div>
      ) : plans.isError ? null : (
        <PlanCards active={active} plans={plans.data ?? []} />
      )}
    </div>
  )
}

function SuccessBanner({
  active,
  pollExpired
}: {
  active: ActiveSubscription | null
  pollExpired: boolean
}) {
  if (active) {
    return (
      <Alert>
        <CheckCircle2 />
        <AlertDescription>Pagamento confirmado. Sua assinatura esta ativa.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <Info />
      <AlertDescription>
        {pollExpired
          ? 'Seu pagamento foi recebido e esta em processamento. Atualize em instantes.'
          : 'Estamos confirmando seu pagamento com o Stripe...'}
      </AlertDescription>
    </Alert>
  )
}

function UsageCard({
  usage
}: {
  usage: {
    data: BillingUsage | undefined
    isError: boolean
    isPending: boolean
  }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso no periodo</CardTitle>
        <CardDescription>Mensagens respondidas pelo bot neste mes</CardDescription>
      </CardHeader>
      <CardContent>
        {usage.isPending ? (
          <Skeleton className="h-6 w-48" />
        ) : usage.isError || !usage.data ? (
          <p className="text-sm text-muted-foreground">Uso indisponivel no momento.</p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p className="text-2xl font-semibold">
              {usage.data.used}
              <span className="text-base font-normal text-muted-foreground">
                {' '}
                de {usage.data.limit}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Restam {usage.data.remaining} mensagens
            </p>
            <p className="text-sm text-muted-foreground">
              Ciclo ate {formatDate(usage.data.periodEnd)}
            </p>
            <Badge variant="outline">{usage.data.planSlug ?? 'free'}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActiveSubscriptionCard({ active }: { active: ActiveSubscription }) {
  const portal = useOpenBillingPortal()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assinatura atual</CardTitle>
        <CardDescription>
          Plano {active.plan}
          {active.periodEnd ? ` - renova em ${formatDate(active.periodEnd)}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Badge variant={active.status === 'active' ? 'default' : 'secondary'}>
          {active.status}
        </Badge>
        {active.cancelAtPeriodEnd ? (
          <span className="text-sm text-muted-foreground">Cancelamento agendado</span>
        ) : null}
        <Button
          disabled={portal.isPending}
          onClick={() => portal.mutate()}
          size="sm"
          variant="outline"
        >
          {portal.isPending ? 'Abrindo...' : 'Gerenciar assinatura'}
        </Button>
      </CardContent>
    </Card>
  )
}

function PlanCards({
  active,
  plans
}: {
  active: ActiveSubscription | null
  plans: BillingPlan[]
}) {
  const free = plans.find((plan) => !isPaidPlan(plan))

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {paidPlans(plans).map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.monthlyMessageLimit} mensagens por mes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {plan.trialDays > 0 ? (
              <p className="text-sm text-muted-foreground">{plan.trialDays} dias de teste gratis</p>
            ) : null}
            <Button asChild className="self-start" size="sm">
              <Link search={{ plan: plan.slug }} to="/checkout">
                Assinar
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}

      {!active && free ? (
        <Card className="opacity-80">
          <CardHeader>
            <CardTitle>{free.name}</CardTitle>
            <CardDescription>{free.monthlyMessageLimit} mensagens por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Seu plano atual sem custo.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
