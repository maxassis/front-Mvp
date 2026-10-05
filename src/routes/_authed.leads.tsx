import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConversationPanel } from '@/features/leads/components/conversation-panel'
import { LeadList } from '@/features/leads/components/lead-list'
import { leadsQuery } from '@/features/leads/queries'
import type { LeadFilter } from '@/features/leads/lead-lifecycle'
import { useUiStore } from '@/stores/ui-store'

export const Route = createFileRoute('/_authed/leads')({ component: LeadsPage })

function LeadsPage() {
  const selectedInstanceId = useUiStore((state) => state.selectedInstanceId)
  const [filter, setFilter] = useState<LeadFilter>('all')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const leads = useQuery(leadsQuery({ instanceId: selectedInstanceId ?? '', status: filter }))

  if (!selectedInstanceId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Building2 className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Nenhuma instancia selecionada</p>
        <p className="text-sm text-muted-foreground">
          Escolha uma instancia no seletor do cabecalho para ver os leads
        </p>
      </div>
    )
  }

  const selectedLead = (leads.data ?? []).find((lead) => lead.id === selectedLeadId)

  return (
    <div className="flex h-full">
      <section aria-label="Leads" className="flex w-80 min-h-0 shrink-0 flex-col border-r">
        <h1 className="px-4 pt-4 text-lg font-semibold">Leads</h1>
        {leads.isError ? (
          <div className="p-3">
            <Alert variant="destructive">
              <AlertDescription>
                Nao foi possivel carregar os leads. {leads.error.message}
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
        <LeadList
          filter={filter}
          isPending={leads.isPending}
          leads={leads.data}
          onFilterChange={(next) => {
            setFilter(next)
            setSelectedLeadId(null)
          }}
          onSelect={setSelectedLeadId}
          selectedLeadId={selectedLeadId}
        />
      </section>

      <section aria-label="Conversa" className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ConversationPanel
          instanceId={selectedInstanceId}
          lead={selectedLead}
          onRefreshLeadList={() => void leads.refetch()}
        />
      </section>
    </div>
  )
}
