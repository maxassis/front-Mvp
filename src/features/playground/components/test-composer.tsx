import { useState } from 'react'
import { Loader2, SendHorizonal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TestComposerProps {
  disabled?: boolean
  isPending: boolean
  onSend: (input: string) => void
}

export function TestComposer({ disabled, isPending, onSend }: TestComposerProps) {
  const [draft, setDraft] = useState('')

  const submit = (): void => {
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
        aria-label="Pergunta para o bot"
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
        placeholder="Pergunte algo ao bot"
        value={draft}
      />
      <Button
        aria-label="Enviar pergunta"
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
