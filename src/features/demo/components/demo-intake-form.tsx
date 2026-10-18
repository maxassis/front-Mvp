import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'

import type { BusinessType, DemoChatbotAnswers } from '@/api/types'
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPES, demoChatbotAnswersSchema } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toneOfVoiceOptions } from '@/features/onboarding/catalog'

interface DemoIntakeFormProps {
  isPending: boolean
  onSubmit: (answers: DemoChatbotAnswers) => void
}

export function DemoIntakeForm({ isPending, onSubmit }: DemoIntakeFormProps) {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType | ''>('')
  const [businessTypeLabel, setBusinessTypeLabel] = useState('')
  const [offerings, setOfferings] = useState('')
  const [differential, setDifferential] = useState('')
  const [assistantName, setAssistantName] = useState('')
  const [tone, setTone] = useState('')

  const isOutros = businessType === 'outros'

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    try {
      onSubmit(
        demoChatbotAnswersSchema.parse({
          assistantName,
          businessName,
          businessType,
          businessTypeLabel,
          differential,
          offerings,
          tone
        })
      )
    } catch {
      toast.error('Confira os campos obrigatorios do formulario')
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="demo-business-name">Nome do negocio</Label>
        <Input
          autoComplete="off"
          id="demo-business-name"
          maxLength={80}
          onChange={(event) => setBusinessName(event.target.value)}
          required
          value={businessName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="demo-business-type">Segmento</Label>
        <Select
          onValueChange={(value) => setBusinessType(value as BusinessType)}
          value={businessType}
        >
          <SelectTrigger className="w-full" id="demo-business-type">
            <SelectValue placeholder="Selecione o segmento..." />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {BUSINESS_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isOutros ? (
        <div className="space-y-2">
          <Label htmlFor="demo-business-type-label">Qual o segmento?</Label>
          <Input
            autoComplete="off"
            id="demo-business-type-label"
            maxLength={120}
            onChange={(event) => setBusinessTypeLabel(event.target.value)}
            placeholder="Ex.: Clinica odontologica"
            required
            value={businessTypeLabel}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="demo-offerings">O que voce oferece?</Label>
        <Textarea
          id="demo-offerings"
          maxLength={500}
          onChange={(event) => setOfferings(event.target.value)}
          placeholder="Ex.: Banho, tosa e consultas"
          required
          rows={3}
          value={offerings}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="demo-differential">O que te diferencia?</Label>
        <Textarea
          id="demo-differential"
          maxLength={500}
          onChange={(event) => setDifferential(event.target.value)}
          placeholder="Ex.: Atendimento sem fila e com hora marcada"
          required
          rows={3}
          value={differential}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="demo-assistant-name">Nome da assistente</Label>
        <Input
          autoComplete="off"
          id="demo-assistant-name"
          maxLength={60}
          onChange={(event) => setAssistantName(event.target.value)}
          placeholder="Ex.: Ana"
          required
          value={assistantName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="demo-tone">Tom de fala</Label>
        <Select onValueChange={setTone} value={tone}>
          <SelectTrigger className="w-full" id="demo-tone">
            <SelectValue placeholder="Selecione o tom de fala..." />
          </SelectTrigger>
          <SelectContent>
            {toneOfVoiceOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? 'Iniciando...' : 'Iniciar conversa'}
      </Button>
    </form>
  )
}
