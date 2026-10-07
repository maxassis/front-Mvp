/**
 * Catalogo frontend das perguntas de comportamento do chatbot. O backend nao
 * expoe endpoint de catalogo e rejeita com 400 qualquer `field_key` fora da
 * whitelist `BEHAVIORAL_FIELD_KEYS`
 * (elysia-rag-api/apps/backend/src/modules/onboarding/onboarding.service.ts),
 * entao esta lista e a fonte unica de verdade do lado do app e o teste
 * `catalog.test.ts` trava a paridade chave a chave.
 *
 * Sem imports de `@/`: `bun test` nao resolve o alias do app (o tsconfig raiz
 * nao tem `paths`), entao este modulo precisa carregar sozinho no teste.
 */

export const FIELD_REQUIREMENTS = [
  'agenda-optional',
  'agenda-required',
  'optional',
  'required'
] as const

export type FieldRequirement = (typeof FIELD_REQUIREMENTS)[number]

export interface CatalogEntry {
  category: string
  fieldKey: string
  label: string
  question: string
  requirement: FieldRequirement
  sortOrder: number
}

type EntryDefinition = Omit<CatalogEntry, 'sortOrder'>

const withSortOrder = (definitions: EntryDefinition[]): CatalogEntry[] =>
  definitions.map((definition, index) => ({ ...definition, sortOrder: (index + 1) * 10 }))

export const toneOfVoiceOptions = [
  'Amigavel',
  'Descontraido',
  'Empatico',
  'Formal',
  'Profissional',
  'Tecnico'
]

export const catalogEntries: CatalogEntry[] = withSortOrder([
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'assistant_goal',
    label: 'Objetivo do chatbot',
    question: 'Qual e o principal objetivo do chatbot?',
    requirement: 'required'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'conversion_goal',
    label: 'Objetivo de conversao',
    question:
      'Qual proxima acao o bot deve buscar: venda, agendamento, proposta, cadastro ou outra?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'qualification_flow',
    label: 'Fluxo de qualificacao',
    question: 'Quais perguntas o bot deve fazer antes de recomendar ou encaminhar?',
    requirement: 'required'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'required_customer_data',
    label: 'Dados a coletar',
    question: 'Quais dados o bot deve coletar antes de encaminhar ou fechar uma oportunidade?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'lead_context_questions',
    label: 'Contexto do interesse',
    question: 'Quais perguntas ajudam a entender o contexto do interesse do cliente?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'customer_need_discovery',
    label: 'Descoberta de necessidade',
    question: 'Como o bot deve descobrir a necessidade principal do cliente?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'budget_qualification',
    label: 'Qualificacao de orcamento',
    question: 'O bot deve perguntar sobre orcamento? Como deve fazer isso?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'purchase_timeline',
    label: 'Prazo de compra',
    question: 'O bot deve perguntar quando o cliente pretende comprar ou contratar?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'urgency_qualification',
    label: 'Urgencia',
    question: 'Como identificar e tratar clientes com urgencia?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'decision_maker_qualification',
    label: 'Decisor da compra',
    question: 'O bot deve identificar quem decide a compra? Como?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'recommendation_rules',
    label: 'Regras de recomendacao',
    question: 'Como o bot deve recomendar produtos ou servicos conforme cada necessidade?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'sales_cta',
    label: 'Chamada para acao',
    question: 'Quais chamadas para acao o bot deve usar para avancar a conversa?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'follow_up_policy',
    label: 'Politica de follow-up',
    question: 'Quando e como o bot deve fazer acompanhamento de um cliente interessado?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'upsell_cross_sell',
    label: 'Upsell e cross-sell',
    question: 'Quais complementos ou upgrades podem ser oferecidos e em que momento?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'negotiation_rules',
    label: 'Regras de negociacao',
    question: 'Quais limites e regras o bot deve seguir durante uma negociacao?',
    requirement: 'optional'
  },
  {
    category: 'Objetivo e qualificacao',
    fieldKey: 'lost_lead_policy',
    label: 'Leads perdidos',
    question: 'Como agir quando o cliente nao responde, desiste ou escolhe outra opcao?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'pricing_policy',
    label: 'Politica de precos',
    question: 'O bot pode falar preco? Se sim, como?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'quote_rules',
    label: 'Regras de orcamento',
    question:
      'Quando o bot pode informar um orcamento e quando deve encaminhar para um consultor?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'security_fraud_policy',
    label: 'Seguranca e fraude',
    question: 'Como o bot deve orientar sobre seguranca, golpes ou suspeita de fraude?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'legal_disclaimer',
    label: 'Aviso legal',
    question: 'Quais avisos legais o bot precisa informar em determinadas situacoes?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'health_safety_disclaimer',
    label: 'Aviso de saude e seguranca',
    question: 'Quais limites de orientacao de saude, seguranca ou risco o bot deve respeitar?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'regulated_advice_policy',
    label: 'Orientacao regulamentada',
    question: 'Quais assuntos regulamentados exigem encaminhamento a um profissional habilitado?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'confidentiality_policy',
    label: 'Confidencialidade',
    question: 'Quais informacoes devem ser tratadas como confidenciais?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'competitor_policy',
    label: 'Comparacao com concorrentes',
    question: 'Como o bot deve responder a perguntas ou comparacoes com concorrentes?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'forbidden_topics',
    label: 'O que o bot nao pode fazer',
    question: 'O que o bot nao pode prometer, dizer ou fazer?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'sensitive_request_policy',
    label: 'Pedidos sensiveis',
    question: 'Como o bot deve lidar com pedidos sensiveis, pessoais ou potencialmente perigosos?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'complaint_policy',
    label: 'Reclamacoes',
    question: 'Como o bot deve receber e encaminhar uma reclamacao?',
    requirement: 'optional'
  },
  {
    category: 'Limites e seguranca',
    fieldKey: 'dispute_resolution_policy',
    label: 'Conflitos e disputas',
    question: 'Como agir quando existe disputa, insatisfacao grave ou ameaca de processo?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'assistant_persona',
    label: 'Persona do assistente',
    question: 'Quem e o assistente e qual papel ele deve assumir no atendimento?',
    requirement: 'required'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'formality_level',
    label: 'Nivel de formalidade',
    question: 'O atendimento deve ser formal, neutro, proximo ou descontraido?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'greeting_style',
    label: 'Saudacao inicial',
    question: 'Como o bot deve cumprimentar e iniciar a conversa?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'closing_style',
    label: 'Encerramento',
    question: 'Como o bot deve encerrar ou resumir uma conversa?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'message_length',
    label: 'Tamanho das mensagens',
    question: 'As mensagens devem ser curtas, detalhadas, em lista ou em etapas?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'emoji_policy',
    label: 'Uso de emojis',
    question: 'O bot pode usar emojis? Em quais situacoes?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'response_format',
    label: 'Formato de resposta',
    question: 'Existem formatos preferidos para respostas, links, listas ou instrucoes?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'clarification_policy',
    label: 'Perguntas de esclarecimento',
    question: 'Quando o bot deve pedir mais detalhes antes de responder?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'source_verification_policy',
    label: 'Confirmacao de informacao',
    question: 'Que informacoes o bot deve confirmar com humano em vez de supor?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'out_of_scope_policy',
    label: 'Assuntos fora do escopo',
    question: 'Como responder quando a pergunta nao for sobre a empresa ou seus servicos?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'after_hours_behavior',
    label: 'Atendimento fora do horario',
    question: 'Como o bot deve agir fora do horario de atendimento?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'urgent_case_handling',
    label: 'Casos urgentes',
    question: 'Como o bot deve reconhecer e encaminhar casos urgentes?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'proactive_message_policy',
    label: 'Mensagens proativas',
    question: 'O bot pode enviar lembretes ou mensagens proativas? Quais regras deve seguir?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'follow_up_message_tone',
    label: 'Tom de follow-up',
    question: 'Como devem ser as mensagens de acompanhamento para nao parecerem insistentes?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'language_switching',
    label: 'Troca de idioma',
    question: 'Quando e como o bot deve trocar de idioma?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'accessibility_communication',
    label: 'Comunicacao acessivel',
    question: 'Quais cuidados de linguagem e formato tornam a conversa mais acessivel?',
    requirement: 'optional'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'tone_of_voice',
    label: 'Tom de voz',
    question: 'Qual tom de voz o bot deve usar?',
    requirement: 'required'
  },
  {
    category: 'Comportamento da IA',
    fieldKey: 'unknown_information_policy',
    label: 'Informacao desconhecida',
    question: 'Como o bot deve responder quando nao souber uma informacao?',
    requirement: 'required'
  },
  {
    category: 'Agendamento',
    fieldKey: 'scheduling_policy',
    label: 'Politica de agendamento',
    question: 'Quais regras o chatbot deve seguir para criar agendamentos?',
    requirement: 'agenda-required'
  },
  {
    category: 'Agendamento',
    fieldKey: 'working_hours',
    label: 'Horarios de funcionamento',
    question: 'Quais dias e horarios estao disponiveis para atendimento e agendamento?',
    requirement: 'agenda-required'
  },
  {
    category: 'Agendamento',
    fieldKey: 'booking_lead_time',
    label: 'Antecedencia para agendar',
    question: 'Qual a antecedencia minima e maxima permitida para agendar?',
    requirement: 'agenda-required'
  },
  {
    category: 'Agendamento',
    fieldKey: 'available_professionals',
    label: 'Profissionais disponiveis',
    question: 'Quais profissionais atendem, quais especialidades possuem e quais horarios seguem?',
    requirement: 'agenda-required'
  },
  {
    category: 'Agendamento',
    fieldKey: 'cancellation_policy',
    label: 'Cancelamento e remarcacao',
    question: 'Quais sao as regras e prazos para cancelar ou remarcar um agendamento?',
    requirement: 'agenda-optional'
  }
])

export const entryByFieldKey = (fieldKey: string): CatalogEntry | undefined =>
  catalogEntries.find((entry) => entry.fieldKey === fieldKey)

const fieldKeysByRequirement = (requirement: FieldRequirement): string[] =>
  catalogEntries.filter((entry) => entry.requirement === requirement).map((entry) => entry.fieldKey)

/** Derivadas do catalogo por filtro, para nenhuma lista paralela sair de sincronia. */
export const requiredFieldKeys: string[] = fieldKeysByRequirement('required')

export const agendaRequiredFieldKeys: string[] = fieldKeysByRequirement('agenda-required')

export const agendaOptionalFieldKeys: string[] = fieldKeysByRequirement('agenda-optional')
