import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSendLeadMessage } from '@/features/leads/mutations'

interface MessageComposerProps {
  instanceId: string
  leadId: string
}

const MAX_MESSAGE_LENGTH = 4096

export function MessageComposer({ instanceId, leadId }: MessageComposerProps) {
  const [text, setText] = useState('')
  const sendMessage = useSendLeadMessage(instanceId)

  const handleSend = (): void => {
    const trimmed = text.trim()
    if (!trimmed || sendMessage.isPending) {
      return
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toast.error('Mensagem muito longa. O limite e de 4096 caracteres.')
      return
    }
    sendMessage.mutate(
      { leadId, text: trimmed },
      { onSuccess: () => setText('') }
    )
  }

  return (
    <div className="space-y-2 border-t p-3">
      <Label htmlFor="lead-composer">Mensagem</Label>
      <Textarea
        disabled={sendMessage.isPending}
        id="lead-composer"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleSend()
          }
        }}
        placeholder="Digite para responder..."
        rows={3}
        value={text}
      />
      <div className="flex justify-end">
        <Button
          disabled={sendMessage.isPending || text.trim().length === 0}
          onClick={handleSend}
          size="sm"
          type="button"
        >
          {sendMessage.isPending ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </div>
  )
}
