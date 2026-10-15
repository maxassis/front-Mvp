import { useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'

import type { PlaygroundTurn } from '../playground-chat'
import { replyBubbles } from '../playground-chat'
import { cn } from '@/lib/utils'

interface TestTranscriptProps {
  turns: PlaygroundTurn[]
}

/** Gomos da resposta do bot. N pode repetir literal, entao o id leva o indice. */
const bubbleId = (turnId: number, index: number): string => `${turnId}:${index}`

export function TestTranscript({ turns }: TestTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // A conversa de teste e curta: todo conteudo novo cola no fim.
  useEffect(() => {
    const container = scrollRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [turns])

  if (turns.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <MessageSquare className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Faca uma pergunta para o bot</p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
      <div className="space-y-3 p-4">
        {turns.map((turn) => (
          <div className="space-y-2" key={turn.id}>
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-lg bg-primary px-3 py-2 text-primary-foreground">
                <p className="text-sm break-words whitespace-pre-wrap">{turn.input}</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div
                className={cn(
                  'max-w-[80%] space-y-1 rounded-lg bg-muted px-3 py-2',
                  turn.reply.media && 'w-full max-w-[80%]'
                )}
              >
                {replyBubbles(turn.reply).map((bubble, index) => (
                  <p className="text-sm break-words whitespace-pre-wrap" key={bubbleId(turn.id, index)}>
                    {bubble}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
