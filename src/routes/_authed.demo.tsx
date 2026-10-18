import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import type { DemoChatbotAnswers } from '@/api/types'
import { ApiError } from '@/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { subscriptionsQuery } from '@/features/billing/queries'
import { DemoComposer } from '@/features/demo/components/demo-composer'
import { DemoIntakeForm } from '@/features/demo/components/demo-intake-form'
import { DemoTranscript } from '@/features/demo/components/demo-transcript'
import {
  MAX_DEMO_EXCHANGES,
  OPENING_INPUT,
  addMessage,
  demoIsFull,
  emptyDemoChat,
  historyTurns,
  joinTurns
} from '@/features/demo/demo-chat'
import type { DemoChat } from '@/features/demo/demo-chat'
import { useSendDemoChatbot } from '@/features/demo/mutations'

export const Route = createFileRoute('/_authed/demo')({ component: DemoPage })

/** O teto vive no tier rag, contado por pessoa; um 429 aqui e passageiro. */
const readRateLimit = (error: unknown): string | null => {
  if (!(error instanceof ApiError) || error.status !== 429) {
    return null
  }
  return 'Muitas mensagens em pouco tempo. Aguarde um instante e siga conversando.'
}

function DemoPage() {
  const send = useSendDemoChatbot()
  const [phase, setPhase] = useState<'form' | 'chat'>('form')
  const [chat, setChat] = useState<DemoChat | null>(null)
  const subscriptions = useQuery(subscriptionsQuery)

  // Quem ja assina nao tem o que testar. Pendente ou erro libera a tela: o
  // teste e o caminho de quem ainda nao decidiu, entao nao barra por duvida.
  if (subscriptions.data) {
    return <Navigate to="/" />
  }

  const handleSubmit = (answers: DemoChatbotAnswers) => {
    const initial = emptyDemoChat(answers)
    setChat(initial)
    setPhase('chat')
    send.mutate(
      { answers, input: OPENING_INPUT, turns: [] },
      {
        onSuccess: (reply) =>
          setChat((current) =>
            current ? addMessage(current, 'assistant', reply.resposta) : current
          )
      }
    )
  }

  const handleSend = (input: string) => {
    if (!chat) {
      return
    }
    // O corpo usa o historico de antes deste turno; a fala nova vai em `input`.
    const turns = historyTurns(chat.messages)
    send.mutate(
      { answers: chat.answers, input, turns },
      {
        onSuccess: (reply) =>
          setChat((current) => (current ? joinTurns(current, input, reply.resposta) : current))
      }
    )
  }

  const handleReset = () => {
    setChat(null)
    setPhase('form')
  }

  if (phase !== 'chat' || !chat) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Teste nosso atendimento</h1>
            <p className="text-sm text-muted-foreground">
              Responda algumas perguntas rapidas e converse com a assistente
            </p>
          </div>
          <DemoIntakeForm isPending={send.isPending} onSubmit={handleSubmit} />
        </div>
      </div>
    )
  }

  const full = demoIsFull(chat)
  const rateLimit = readRateLimit(send.error)

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{chat.answers.businessName}</h1>
          <p className="truncate text-sm text-muted-foreground">
            Assistente: {chat.answers.assistantName}
          </p>
        </div>
        <Button onClick={handleReset} size="sm" type="button" variant="outline">
          Nova conversa
        </Button>
      </div>

      {rateLimit ? (
        <Alert className="mt-2">
          <AlertDescription>{rateLimit}</AlertDescription>
        </Alert>
      ) : send.isError ? (
        <Alert className="mt-2" variant="destructive">
          <AlertDescription>
            Nao foi possivel falar com a assistente.
            {send.error instanceof Error ? ` ${send.error.message}` : ''}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-2 flex min-h-0 flex-1 flex-col border-b">
        <DemoTranscript
          emptyCopy={
            send.isError
              ? 'A conversa nao abriu. Escreva uma mensagem para tentar de novo.'
              : undefined
          }
          messages={chat.messages}
        />
      </div>

      {full ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border bg-muted/40 p-4 text-center">
          <p className="text-sm font-medium">Gostou? Escolha um plano para usar com seu numero</p>
          <Button asChild size="sm">
            <Link to="/plano">Escolher plano</Link>
          </Button>
        </div>
      ) : null}

      <DemoComposer disabled={full} isPending={send.isPending} onSend={handleSend} />
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Teste limitado: ate {MAX_DEMO_EXCHANGES} perguntas por conversa.
      </p>
    </div>
  )
}
