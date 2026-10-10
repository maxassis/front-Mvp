import { useRef, useState } from 'react'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { Smile } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useSendLeadMessage } from '@/features/leads/mutations'

interface MessageComposerProps {
  instanceId: string
  leadId: string
}

const MAX_MESSAGE_LENGTH = 4096

export function MessageComposer({ instanceId, leadId }: MessageComposerProps) {
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendMessage = useSendLeadMessage(instanceId)

  const insertEmoji = (data: EmojiClickData): void => {
    const emoji = data.emoji
    const el = textareaRef.current
    if (!el) {
      setText((previous) => previous + emoji)
      return
    }
    const start = el.selectionStart ?? text.length
    const end = el.selectionEnd ?? text.length
    const next = text.slice(0, start) + emoji + text.slice(end)
    setText(next)
    requestAnimationFrame(() => {
      el.focus()
      const position = start + emoji.length
      el.setSelectionRange(position, position)
    })
  }

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
        ref={textareaRef}
        rows={3}
        value={text}
      />
      <div className="flex items-center justify-between">
        <Popover onOpenChange={setEmojiOpen} open={emojiOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-label="Inserir emoji"
              disabled={sendMessage.isPending}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Smile />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto border-0 p-0" side="top">
            <EmojiPicker onEmojiClick={insertEmoji} searchPlaceHolder="Buscar emoji..." />
          </PopoverContent>
        </Popover>
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
