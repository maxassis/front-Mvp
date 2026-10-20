import { MAX_DEMO_EXCHANGES } from './demo-chat'

/** O backend renova o saldo na meia-noite de Brasilia. */
const RESET_TIME_ZONE = 'America/Sao_Paulo'

/** A renovacao cai sempre na meia-noite, entao e tambem o fallback de data ruim. */
const MIDNIGHT = '00:00'

const resetTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: RESET_TIME_ZONE
})

/**
 * Horario da proxima renovacao em Brasilia. A data chega crua do backend e um
 * valor invalido derrubaria a tela, entao cai na meia-noite, que e o horario
 * real da renovacao.
 */
export const formatResetTime = (resetsAt: string): string => {
  const date = new Date(resetsAt)
  if (Number.isNaN(date.getTime())) {
    return MIDNIGHT
  }
  return resetTimeFormatter.format(date)
}

/** Aviso de saldo acabar, com a hora da renovacao. */
export const quotaExhaustedMessage = (resetsAt: string): string =>
  `Voce usou todas as mensagens de hoje. O saldo renova as ${formatResetTime(resetsAt)} (horario de Brasilia).`

/** Aviso do teto da conversa, que e menor que o saldo do dia. */
export const exchangeLimitMessage = (): string =>
  `Voce chegou ao limite de ${MAX_DEMO_EXCHANGES} perguntas desta conversa.`

/** Contador das mensagens que ainda sobram hoje. */
export const remainingMessagesLabel = (remaining: number): string =>
  `Restam ${remaining} mensagens hoje`
