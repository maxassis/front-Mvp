import { useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'

import type { DemoMessage } from '../demo-chat'
import { cn } from '@/lib/utils'

interface DemoTranscriptProps {
  emptyCopy?: string
  messages: DemoMessage[]
}

export function DemoTranscript({ emptyCopy, messages }: DemoTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Conversa curta: cada mensagem nova cola no fim do painel.
  useEffect(() => {
    const container = scrollRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <MessageSquare className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {emptyCopy ?? 'Carregando a assistente...'}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
      <div className="space-y-3 p-4">
        {messages.map((message) => (
          <div
            className={cn('flex', message.role === 'visitor' ? 'justify-end' : 'justify-start')}
            key={message.id}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3 py-2',
                message.role === 'visitor' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
