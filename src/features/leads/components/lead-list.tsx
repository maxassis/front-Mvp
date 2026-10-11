import { MessageSquare } from 'lucide-react'

import type { Lead } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { leadDisplayName, leadIntent } from '@/features/leads/lead-display'
import { LEAD_FILTER_LABEL, LEAD_FILTERS, leadLifecycle } from '@/features/leads/lead-lifecycle'
import type { LeadFilter } from '@/features/leads/lead-lifecycle'
import { cn } from '@/lib/utils'

interface LeadListProps {
  filter: LeadFilter
  isPending: boolean
  leads: Lead[] | undefined
  onFilterChange: (filter: LeadFilter) => void
  onSelect: (leadId: string) => void
  selectedLeadId: string | null
}

const formatUpdatedAt = (value: string): string =>
  new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit'
  })

export function LeadList({
  filter,
  isPending,
  leads,
  onFilterChange,
  onSelect,
  selectedLeadId
}: LeadListProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0 p-3">
        {/* Quatro rotulos nao cabem numa linha de 288px. Grade 2x2 com botoes
            proprios evita a briga de altura do TabsList (h-8 fixo do variant
            cortava a segunda linha e o card sobrepunha as abas). */}
        <div className="grid min-w-0 grid-cols-2 gap-1" role="tablist" aria-label="Filtrar leads">
          {LEAD_FILTERS.map((option) => (
            <Button
              key={option}
              onClick={() => onFilterChange(option)}
              role="tab"
              aria-selected={filter === option}
              size="sm"
              type="button"
              variant={filter === option ? 'secondary' : 'ghost'}
              className="min-w-0"
            >
              <span className="truncate">{LEAD_FILTER_LABEL[option]}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Scroll nativo: o Viewport do Radix embrulha tudo num display:table
          que estica pela largura do texto e impede o truncate de disparar. */}
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto border-t">
        {isPending ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton className="h-16 w-full" key={index} />
            ))}
          </div>
        ) : !leads || leads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-12 text-center">
            <MessageSquare className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum lead por aqui</p>
          </div>
        ) : (
          <div className="min-w-0 pb-3">
            {leads.map((lead) => {
              const isSelected = lead.id === selectedLeadId
              const displayName = leadDisplayName(lead)
              const intent = leadIntent(lead)
              return (
                <button
                  aria-current={isSelected}
                  className={cn(
                    'w-full min-w-0 overflow-hidden border-b px-3 py-3 text-left transition-colors hover:bg-muted/60',
                    isSelected ? 'bg-muted' : 'bg-transparent'
                  )}
                  key={lead.id}
                  onClick={() => onSelect(lead.id)}
                  type="button"
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium" title={displayName}>{displayName}</p>
                    <Badge className="shrink-0" variant="secondary">{leadLifecycle(lead.status).label}</Badge>
                  </div>
                  {intent ? (
                    <p className="mt-1 block w-full min-w-0 truncate text-xs text-muted-foreground" title={intent}>
                      {intent}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatUpdatedAt(lead.updatedAt)}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
