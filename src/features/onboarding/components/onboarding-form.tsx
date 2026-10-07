import { useState } from 'react'
import type { FormEvent } from 'react'

import type { OnboardingItem } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { CatalogEntry } from '@/features/onboarding/catalog'
import { entryByFieldKey, toneOfVoiceOptions } from '@/features/onboarding/catalog'
import { isLockedField, onboardingState } from '@/features/onboarding/onboarding-state'
import { useCreateOnboardingItem } from '@/features/onboarding/mutations'

interface OnboardingFormProps {
  agendaEnabled: boolean
  instanceId: string
  items: OnboardingItem[]
}

export function OnboardingForm({ agendaEnabled, instanceId, items }: OnboardingFormProps) {
  const create = useCreateOnboardingItem(instanceId)
  const [search, setSearch] = useState('')
  const [selectedFieldKey, setSelectedFieldKey] = useState('')
  const [answer, setAnswer] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const state = onboardingState(agendaEnabled, items, search)
  const selected: CatalogEntry | undefined = selectedFieldKey
    ? entryByFieldKey(selectedFieldKey)
    : undefined
  const locked = selected ? isLockedField(selected, agendaEnabled) : false

  const selectField = (fieldKey: string) => {
    setSelectedFieldKey(fieldKey)
    setAnswer('')
    setEnabled(true)
    setFormError(null)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!selected || !answer.trim()) {
      setFormError('Selecione uma pergunta e preencha a resposta')
      return
    }
    setFormError(null)
    create.mutate(
      {
        answer: answer.trim(),
        enabled: locked ? true : enabled,
        fieldKey: selected.fieldKey,
        question: selected.question,
        required: selected.requirement === 'required',
        sortOrder: selected.sortOrder
      },
      {
        onSuccess: () => {
          setSelectedFieldKey('')
          setAnswer('')
          setEnabled(true)
        }
      }
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">
        Configure apenas como o chatbot deve atender. Informacoes factuais da empresa ficam nos
        arquivos da base de conhecimento.
      </p>

      {!state.canAddOptional && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Perguntas obrigatorias pendentes</p>
          <p className="text-sm text-muted-foreground">
            Preencha estes campos antes de adicionar perguntas opcionais.
          </p>
          <div className="flex flex-wrap gap-2">
            {state.pendingRequired.map((entry) => (
              <Button
                key={entry.fieldKey}
                onClick={() => selectField(entry.fieldKey)}
                size="sm"
                type="button"
                variant={selected?.fieldKey === entry.fieldKey ? 'default' : 'outline'}
              >
                {entry.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {state.canAddOptional && (
        <>
          <div className="space-y-2">
            <Label htmlFor="onboarding-search">Buscar no catalogo</Label>
            <Input
              autoComplete="off"
              id="onboarding-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex.: entrega, consulta, pagamento..."
              type="search"
              value={search}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-question">Pergunta</Label>
            <Select onValueChange={selectField} value={selectedFieldKey}>
              <SelectTrigger className="w-full" id="onboarding-question">
                <SelectValue placeholder="Selecione uma pergunta..." />
              </SelectTrigger>
              <SelectContent>
                {state.availableGroups.map((group) => (
                  <SelectGroup key={group.category}>
                    <SelectLabel>{group.category}</SelectLabel>
                    {group.entries.map((entry) => (
                      <SelectItem key={entry.fieldKey} value={entry.fieldKey}>
                        {entry.requirement === 'required'
                          ? `${entry.label} (Obrigatoria)`
                          : entry.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {state.availableCount} opcoes disponiveis
            </p>
          </div>
        </>
      )}

      {selected && (
        <>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{selected.label}</p>
              {selected.requirement === 'required' && <Badge variant="secondary">Obrigatoria</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{selected.question}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-answer">Resposta</Label>
            {selected.fieldKey === 'tone_of_voice' ? (
              <Select
                onValueChange={(value) => {
                  setAnswer(value)
                  setFormError(null)
                }}
                value={answer}
              >
                <SelectTrigger className="w-full" id="onboarding-answer">
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
                id="onboarding-answer"
                onChange={(event) => {
                  setAnswer(event.target.value)
                  setFormError(null)
                }}
                placeholder="Digite a resposta que a IA deve considerar..."
                rows={5}
                value={answer}
              />
            )}
          </div>

          <label
            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
            htmlFor="onboarding-enabled"
          >
            Ativo no contexto da IA
            <Switch
              checked={locked ? true : enabled}
              disabled={locked}
              id="onboarding-enabled"
              onCheckedChange={setEnabled}
            />
          </label>
        </>
      )}

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <Button className="w-full" disabled={create.isPending || !selected} type="submit">
        {create.isPending ? 'Salvando pergunta...' : 'Salvar pergunta'}
      </Button>
    </form>
  )
}
