import { MessageSquare } from 'lucide-react'

import type { Lead } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { leadDisplayName, leadSubtitle } from '@/features/leads/lead-display'
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-3">
        <Tabs
          onValueChange={(value) => {
            const next = LEAD_FILTERS.find((option) => option === value)
            if (next) {
              onFilterChange(next)
            }
          }}
          value={filter}
        >
          <TabsList className="grid w-full grid-cols-4">
            {LEAD_FILTERS.map((option) => (
              <TabsTrigger key={option} value={option}>
                {LEAD_FILTER_LABEL[option]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 px-3 pb-3">
          {isPending ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton className="h-16 w-full" key={index} />
              ))}
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <MessageSquare className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum lead por aqui</p>
            </div>
          ) : (
            leads.map((lead) => {
              const isSelected = lead.id === selectedLeadId
              return (
                <button
                  aria-current={isSelected}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/60',
                    isSelected ? 'border-primary bg-muted' : 'border-transparent'
                  )}
                  key={lead.id}
                  onClick={() => onSelect(lead.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{leadDisplayName(lead)}</p>
                    <Badge variant="secondary">{leadLifecycle(lead.status).label}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {leadSubtitle(lead)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatUpdatedAt(lead.updatedAt)}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
