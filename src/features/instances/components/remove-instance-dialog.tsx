import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import type { WhatsappInstance, WhatsappProvider } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useRemoveInstance } from '@/features/instances/mutations'

// O texto muda por provedor porque a consequencia e diferente: a WAHA derruba a
// sessao, ja o Cloud API deixa de ter o webhook da Meta atendido.
const REMOVE_DESCRIPTION = {
  waha: 'A sessao da WAHA tambem sera destruida e o numero perdera a conexao.',
  whatsapp_cloud_api: 'O webhook da Meta deixa de ser atendido e a instancia nao recebera mais mensagens.'
} as const satisfies Record<WhatsappProvider, string>

interface RemoveInstanceDialogProps {
  instance: WhatsappInstance
}

export function RemoveInstanceDialog({ instance }: RemoveInstanceDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const remove = useRemoveInstance()
  const displayName = instance.instanceName ?? instance.phoneNumber

  const handleRemove = () => {
    remove.mutate(instance.id, { onSuccess: () => setIsOpen(false) })
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="destructive">
          <Trash2 /> Remover
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover {displayName}?</DialogTitle>
          <DialogDescription>{REMOVE_DESCRIPTION[instance.provider]}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button
            disabled={remove.isPending}
            onClick={handleRemove}
            type="button"
            variant="destructive"
          >
            {remove.isPending ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
