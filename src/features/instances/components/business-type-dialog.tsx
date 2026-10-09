import { useState } from 'react'

import type { BusinessType, WhatsappInstance } from '@/api/types'
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPES } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useSetBusinessType } from '@/features/instances/mutations'

interface BusinessTypeDialogProps {
  instance: WhatsappInstance
  onOpenChange: (open: boolean) => void
  open: boolean
}

/**
 * Dialog controlado pelo cartao: a mesma abertura serve ao botao "Segmento" e a
 * tentativa de ligar o chatbot sem segmento. Sem trigger proprio de proposito.
 */
export function BusinessTypeDialog({ instance, onOpenChange, open }: BusinessTypeDialogProps) {
  const [category, setCategory] = useState<BusinessType | ''>(instance.businessType ?? '')
  const [label, setLabel] = useState(instance.businessTypeLabel ?? '')
  const setBusinessType = useSetBusinessType(instance.id)
  const displayName = instance.instanceName ?? instance.phoneNumber

  // 'outros' sem texto livre nao diz nada ao RAG; o backend tambem rejeita.
  const isLabelMissing = category === 'outros' && label.trim().length === 0
  const canSubmit = category !== '' && !isLabelMissing

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setCategory(instance.businessType ?? '')
      setLabel(instance.businessTypeLabel ?? '')
    }
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (!canSubmit) {
      return
    }
    setBusinessType.mutate(
      { businessType: category, businessTypeLabel: label },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Segmento de {displayName}</DialogTitle>
          <DialogDescription>
            O tipo de negocio orienta as respostas do assistente no WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`business-type-${instance.id}`}>Tipo de negocio</Label>
            <Select onValueChange={(value) => setCategory(value as BusinessType)} value={category}>
              <SelectTrigger className="w-full" id={`business-type-${instance.id}`}>
                <SelectValue placeholder="Selecione o tipo de negocio..." />
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

          <div className="space-y-2">
            <Label htmlFor={`business-type-label-${instance.id}`}>
              Descricao {category === 'outros' ? '' : '(opcional)'}
            </Label>
            <Input
              autoComplete="off"
              id={`business-type-label-${instance.id}`}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Ex.: Clinica odontologica"
              value={label}
            />
            {isLabelMissing ? (
              <p className="text-sm text-destructive">Descreva o tipo de negocio.</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button
            disabled={!canSubmit || setBusinessType.isPending}
            onClick={handleSubmit}
            type="button"
          >
            {setBusinessType.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
