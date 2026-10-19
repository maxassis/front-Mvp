import { Link, createFileRoute } from '@tanstack/react-router'
import { MessageCircle, CalendarClock, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/landing')({
  component: LandingPage
})

const FEATURES = [
  {
    description: 'Responde os clientes do seu WhatsApp com as informacoes do seu negocio.',
    icon: MessageCircle,
    title: 'Atendimento no piloto automatico'
  },
  {
    description: 'Entende a conversa, coleta os dados e agenda atendimentos por voce.',
    icon: CalendarClock,
    title: 'Agendamento sem esforco'
  },
  {
    description: 'Teste o atendimento em poucos cliques, sem cartao de credito.',
    icon: Sparkles,
    title: 'Teste gratuito'
  }
] as const

function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <span className="text-sm font-semibold tracking-tight">Bonds Chat</span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/login">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Chatbot de atendimento no seu WhatsApp
        </h1>
        <p className="text-lg text-muted-foreground">
          Seu negocio conectado, pronto para responder seus clientes, agendar e vender enquanto
          voce cuida do resto.
        </p>
        <Button asChild size="lg">
          <Link to="/demo">Testar atendimento</Link>
        </Button>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-6 pb-16 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div className="rounded-xl border bg-card p-6" key={feature.title}>
            <feature.icon className="size-8 text-muted-foreground" />
            <h2 className="mt-4 font-medium">{feature.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
