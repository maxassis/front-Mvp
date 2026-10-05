import type { LeadStatus } from '@/api/types'

interface LeadLifecycle {
  /** `true` quando o bot ainda enfileira respostas nessa conversa. */
  botIsAnswering: boolean
  canAssign: boolean
  canClose: boolean
  canSendMessage: boolean
  /** Texto do rodape no lugar do composer. `null` quando o composer aparece. */
  composerNote: string | null
  label: string
}

/**
 * O que o operador pode fazer com um lead em cada estado, num lugar so.
 *
 * A regra vem do backend: com o lead em `assigned` o intake para de enfileirar
 * o chatbot naquela conversa (README, secao Leads), e o composer so faz
 * sentido em `assigned`, que e o unico estado em que a resposta humana e a do
 * bot nao disputam a mesma mensagem. O resto sai daqui em vez de tres
 * condicionais espalhados por lista, cabecalho e composer.
 */
export const LEAD_LIFECYCLE = {
  assigned: {
    botIsAnswering: false,
    canAssign: false,
    canClose: true,
    canSendMessage: true,
    composerNote: null,
    label: 'Em atendimento'
  },
  closed: {
    botIsAnswering: true,
    canAssign: false,
    canClose: false,
    canSendMessage: false,
    composerNote: 'Lead fechado. O bot voltou a responder.',
    label: 'Fechado'
  },
  new: {
    botIsAnswering: true,
    canAssign: true,
    canClose: true,
    canSendMessage: false,
    composerNote: 'Assuma o lead para responder. Enquanto estiver pendente, o bot continua atendendo.',
    label: 'Pendente'
  }
} as const satisfies Record<LeadStatus, LeadLifecycle>

export const leadLifecycle = (status: LeadStatus): LeadLifecycle => LEAD_LIFECYCLE[status]

export const LEAD_FILTERS = ['all', 'new', 'assigned', 'closed'] as const
export type LeadFilter = (typeof LEAD_FILTERS)[number]

export const LEAD_FILTER_LABEL = {
  all: 'Todos',
  assigned: 'Em atendimento',
  closed: 'Fechados',
  new: 'Pendentes'
} as const satisfies Record<LeadFilter, string>
