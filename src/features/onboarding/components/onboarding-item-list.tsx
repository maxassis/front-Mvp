import { useState } from 'react'
import { MessageSquare, Pencil, Trash2 } from 'lucide-react'

import type { OnboardingItem } from '@/api/types'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toneOfVoiceOptions } from '@/features/onboarding/catalog'
import { isLockedField, onboardingState } from '@/features/onboarding/onboarding-state'
import {
  useRemoveOnboardingItem,
  useToggleOnboardingItem,
  useUpdateOnboardingItem
} from '@/features/onboarding/mutations'

interface OnboardingItemListProps {
  agendaEnabled: boolean
  instanceId: string
  items: OnboardingItem[]
}

export function OnboardingItemList({ agendaEnabled, instanceId, items }: OnboardingItemListProps) {
  const { savedEntries } = onboardingState(agendaEnabled, items, '')

  if (savedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-12 text-center">
        <MessageSquare className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhuma pergunta cadastrada ainda</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Perguntas cadastradas</h2>
      {savedEntries.map(({ entry, item }) => (
        <SavedItemRow
          instanceId={instanceId}
          item={item}
          key={item.id}
          locked={isLockedField(entry, agendaEnabled)}
          required={entry.requirement === 'required'}
        />
      ))}
    </div>
  )
}

interface SavedItemRowProps {
  instanceId: string
  item: OnboardingItem
  locked: boolean
  required: boolean
}

function SavedItemRow({ instanceId, item, locked, required }: SavedItemRowProps) {
  // Repetir o Dialog por linha em vez de um estado compartilhado mantem a
  // confirmacao junto da acao, como em remove-instance-dialog.
  const [isOpen, setIsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [draft, setDraft] = useState(item.answer ?? '')
  const toggle = useToggleOnboardingItem(instanceId)
  const remove = useRemoveOnboardingItem(instanceId)
  const update = useUpdateOnboardingItem(instanceId)

  const handleRemove = () => {
    remove.mutate(item.id, { onSuccess: () => setIsOpen(false) })
  }

  const openEdit = (open: boolean) => {
    if (open) {
      setDraft(item.answer ?? '')
    }
    setIsEditOpen(open)
  }

  const handleSave = () => {
    const answer = draft.trim()
    if (!answer) {
      return
    }
    update.mutate({ answer, itemId: item.id }, { onSuccess: () => setIsEditOpen(false) })
  }

  const isToneOfVoice = item.fieldKey === 'tone_of_voice'

  return (
    <div className="flex items-start justify-between gap-3 border-b px-1 py-3">
      <div className="min-w-0 flex-1">
        <p className="min-w-0 truncate text-sm font-medium">{item.question}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{item.fieldKey}</span>
          <span>{item.enabled ? 'Ativa' : 'Inativa'}</span>
          {required && <Badge variant="secondary">Obrigatoria</Badge>}
        </div>
        {item.answer ? <p className="mt-1 text-sm">{item.answer}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Switch
          aria-label={`${item.enabled ? 'Desativar' : 'Ativar'} ${item.fieldKey}`}
          checked={item.enabled}
          disabled={toggle.isPending || locked}
          onCheckedChange={(next) => toggle.mutate({ enabled: next, itemId: item.id })}
        />
        <Dialog onOpenChange={openEdit} open={isEditOpen}>
          <DialogTrigger asChild>
            <Button aria-label={`Editar resposta de ${item.fieldKey}`} size="sm" type="button" variant="outline">
              <Pencil /> Editar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar resposta</DialogTitle>
              <DialogDescription>{item.question}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`onboarding-edit-${item.id}`}>Resposta</Label>
              {isToneOfVoice ? (
                <Select onValueChange={setDraft} value={draft}>
                  <SelectTrigger className="w-full" id={`onboarding-edit-${item.id}`}>
                    <SelectValue placeholder="Selecione o tom de voz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOfVoiceOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Textarea
                  id={`onboarding-edit-${item.id}`}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={5}
                  value={draft}
                />
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditOpen(false)} type="button" variant="outline">
                Cancelar
              </Button>
              <Button
                disabled={update.isPending || !draft.trim()}
                onClick={handleSave}
                type="button"
              >
                {update.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {locked ? null : (
          <Dialog onOpenChange={setIsOpen} open={isOpen}>
            <DialogTrigger asChild>
              <Button size="sm" type="button" variant="destructive">
                <Trash2 /> Remover
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remover {item.fieldKey}?</DialogTitle>
                <DialogDescription>
                  A pergunta sai do contexto da IA. Da para cadastrar de novo depois.
                </DialogDescription>
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
        )}
      </div>
    </div>
  )
}
