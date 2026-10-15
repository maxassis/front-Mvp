import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { instancesQuery } from '@/features/instances/queries'
import { TestComposer } from '@/features/playground/components/test-composer'
import { TestTranscript } from '@/features/playground/components/test-transcript'
import { useTestChatbot } from '@/features/playground/mutations'
import { addReply, emptyChat, historyTurns } from '@/features/playground/playground-chat'
import type { PlaygroundChat } from '@/features/playground/playground-chat'
import { useUiStore } from '@/stores/ui-store'

const playgroundSearchSchema = z.object({
  instanceId: z.string().optional()
})

export const Route = createFileRoute('/_authed/playground')({
  component: PlaygroundPage,
  validateSearch: playgroundSearchSchema
})

function PlaygroundPage() {
  // Mesmo arranjo do /files: instancia pela URL com o Zustand de reserva.
  const searchInstanceId = Route.useSearch({ select: (search) => search.instanceId })
  const selectedInstanceId = useUiStore((state) => state.selectedInstanceId)
  const instanceId = searchInstanceId ?? selectedInstanceId

  const instances = useQuery(instancesQuery)
  // A conversa de teste nasce aqui e morre aqui: nada grava no servidor.
  const [chat, setChat] = useState<PlaygroundChat>(emptyChat)
  const test = useTestChatbot(instanceId ?? '')

  if (!instanceId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <FlaskConical className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Nenhuma instancia selecionada</p>
        <p className="text-sm text-muted-foreground">
          Volte para Conexoes e abra o teste de uma instancia
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/">Ver conexoes</Link>
        </Button>
      </div>
    )
  }

  const instance = (instances.data ?? []).find((current) => current.id === instanceId)

  const handleSend = (input: string): void => {
    test.mutate(
      { input, slots: chat.slots, turns: historyTurns(chat.turns) },
      { onSuccess: (reply) => setChat((current) => addReply(current, input, reply)) }
    )
  }

  const handleReset = (): void => {
    setChat(emptyChat())
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Testar bot</h1>
          <p className="truncate text-sm text-muted-foreground">
            {instances.isPending
              ? 'Carregando instancia...'
              : (instance?.instanceName ?? instance?.providerInstanceId)}
          </p>
        </div>
        <Button
          disabled={test.isPending || chat.turns.length === 0}
          onClick={handleReset}
          size="sm"
          type="button"
          variant="outline"
        >
          Nova conversa
        </Button>
      </div>

      {test.isError ? (
        <Alert className="mt-2" variant="destructive">
          <AlertDescription>
            Nao foi possivel testar o bot.
            {test.error instanceof Error ? ` ${test.error.message}` : ''}
          </AlertDescription>
        </Alert>
      ) : null}

      {instances.isPending ? (
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-64 w-3/4" />
        </div>
      ) : instances.isSuccess && !instance ? (
        <p className="text-sm text-muted-foreground">Instancia nao encontrada</p>
      ) : (
        <>
          <div className="mt-2 text-xs text-muted-foreground">
            Respostas simulam o atendimento de verdade e nada e enviado ao WhatsApp.
          </div>
          <div className="flex min-h-0 flex-1 flex-col border-b">
            <TestTranscript turns={chat.turns} />
          </div>
          <TestComposer disabled={!instance} isPending={test.isPending} onSend={handleSend} />
        </>
      )}
    </div>
  )
}
