import { useState } from 'react'
import { Loader2, SendHorizonal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface DemoComposerProps {
  disabled?: boolean
  isPending: boolean
  onSend: (input: string) => void
}

export function DemoComposer({ disabled, isPending, onSend }: DemoComposerProps) {
  const [draft, setDraft] = useState('')

  const submit = (): void => {
    // Enter e clique compartilham a tranca: enquanto a resposta pendente
    // publica, o historico do visitante ainda nao esta no estado.
    if (disabled || isPending) {
      return
    }
    const trimmed = draft.trim()
    if (trimmed.length === 0) {
      return
    }
    setDraft('')
    onSend(trimmed)
  }

  return (
    <div className="flex items-end gap-2 border-t p-3">
      <Textarea
        aria-label="Mensagem para a assistente"
        className="max-h-40 min-h-12"
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // Enter envia e Shift+Enter quebra linha, como em qualquer chat.
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
        placeholder="Fale com a assistente"
        value={draft}
      />
      <Button
        aria-label="Enviar mensagem"
        disabled={disabled || isPending || draft.trim().length === 0}
        onClick={submit}
        size="icon"
        type="button"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
      </Button>
    </div>
  )
}
