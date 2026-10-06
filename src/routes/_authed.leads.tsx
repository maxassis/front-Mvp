import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { z } from 'zod'

import type { Lead } from '@/api/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ConversationPanel } from '@/features/leads/components/conversation-panel'
import { LeadList } from '@/features/leads/components/lead-list'
import { leadsQuery } from '@/features/leads/queries'
import type { LeadFilter } from '@/features/leads/lead-lifecycle'
import { useLeadsRealtime } from '@/features/leads/use-leads-realtime'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

const leadsSearchSchema = z.object({
  instanceId: z.string().optional(),
  leadId: z.string().optional()
})

export const Route = createFileRoute('/_authed/leads')({
  component: LeadsPage,
  validateSearch: leadsSearchSchema
})

function LeadsPage() {
  // Instancia e lead vêm da URL para sobreviver ao reload; o Zustand fica como
  // reserva para a navegacao interna que ainda nao passa o parametro.
  const searchInstanceId = Route.useSearch({ select: (search) => search.instanceId })
  const searchLeadId = Route.useSearch({ select: (search) => search.leadId })
  const navigate = Route.useNavigate()
  const selectedInstanceId = useUiStore((state) => state.selectedInstanceId)
  const instanceId = searchInstanceId ?? selectedInstanceId
  const selectedLeadId = searchLeadId ?? null
  const [filter, setFilter] = useState<LeadFilter>('all')
  const lastKnownLead = useRef<Lead | undefined>(undefined)

  // Replace para nao poluir o Voltar do browser a cada lead aberto.
  const selectLead = (leadId: string | null) =>
    navigate({ search: (previous) => ({ ...previous, leadId: leadId ?? undefined }), replace: true })

  // O stream abre na rota e nao no layout autenticado: so a tela de leads
  // consome esses eventos, e fechar a rota deve derrubar a conexao.
  useLeadsRealtime()

  const leads = useQuery(leadsQuery({ instanceId: instanceId ?? '', status: filter }))

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

  if (!instanceId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Building2 className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Nenhuma instancia selecionada</p>
        <p className="text-sm text-muted-foreground">
          Volte para Conexoes e abra os leads de uma instancia
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/">Ver conexoes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden md:flex-row">
      {/* No mobile mostra ou a lista ou a conversa (master-detail); no desktop
          as duas ficam lado a lado. Sem isso, w-72 fixo + conversa espremiam
          tudo e o conteudo cortava na borda direita da tela. */}
      <section
        aria-label="Leads"
        className={cn(
          'flex min-h-0 w-full shrink-0 flex-col border-r md:w-80',
          selectedLead ? 'hidden md:flex' : 'flex'
        )}
      >
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
            selectLead(null)
          }}
          onSelect={(leadId) => selectLead(leadId)}
          selectedLeadId={selectedLeadId}
        />
      </section>

      <section
        aria-label="Conversa"
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col',
          selectedLead ? 'flex' : 'hidden md:flex'
        )}
      >
        <ConversationPanel
          instanceId={instanceId}
          lead={selectedLead}
          onBack={() => selectLead(null)}
          onRefreshLeadList={() => void leads.refetch()}
        />
      </section>
    </div>
  )
}
