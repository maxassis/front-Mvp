import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { useRef, useState } from 'react'

import type { Lead } from '@/api/types'
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
  const lastKnownLead = useRef<Lead | undefined>(undefined)

  const leads = useQuery(leadsQuery({ instanceId: selectedInstanceId ?? '', status: filter }))

  // Assumir tira o lead da aba "Pendentes", entao a lista recarregada sem ele e a
  // conversa fecharia na mao do operador logo depois de ele abrir o composer.
  // A ultima versao conhecida do lead, segurada em ref, mantem a conversa aberta
  // enquanto o lead nao esta mais na lista.
  const freshLead = (leads.data ?? []).find((lead) => lead.id === selectedLeadId)

  if (freshLead) {
    lastKnownLead.current = freshLead
  } else if (!selectedLeadId) {
    lastKnownLead.current = undefined
  }

  const selectedLead = freshLead ?? lastKnownLead.current

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

  return (
    <div className="flex h-full">
      <section aria-label="Leads" className="flex w-72 min-h-0 shrink-0 flex-col border-r">
        <div className="shrink-0 border-b p-3">
          <h1 className="text-lg font-semibold">Leads</h1>
          {leads.isError ? (
            <Alert className="mt-2" variant="destructive">
              <AlertDescription>
                Nao foi possivel carregar os leads. {leads.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
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
