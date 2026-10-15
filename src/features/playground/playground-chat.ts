import type { ChatbotTestReply, ChatbotTestRole } from '@/api/types'

export interface PlaygroundTurn {
  id: number
  input: string
  reply: ChatbotTestReply
}

export interface PlaygroundChat {
  nextId: number
  /** Sacos de dados aprendidos ate agora; devem voltar na proxima chamada. */
  slots: Record<string, string>
  turns: PlaygroundTurn[]
}

export const emptyChat = (): PlaygroundChat => ({ nextId: 1, slots: {}, turns: [] })

/** Texto em gomos do bot: a lista de respostas quando existe, senao o texto unico. */
export const replyBubbles = (reply: ChatbotTestReply): string[] =>
  reply.respostas && reply.respostas.length > 0 ? reply.respostas : [reply.resposta]

/** Historico no formato do grafo: cada turno e pergunta do cliente + fala do bot. */
export const historyTurns = (
  turns: PlaygroundTurn[]
): Array<{ role: ChatbotTestRole; text: string }> => {
  const history: Array<{ role: ChatbotTestRole; text: string }> = []
  for (const turn of turns) {
    history.push(
      { role: 'customer', text: turn.input.trim() },
      { role: 'assistant', text: replyBubbles(turn.reply).join('\n') }
    )
  }
  return history
}

export const addReply = (
  chat: PlaygroundChat,
  input: string,
  reply: ChatbotTestReply
): PlaygroundChat => ({
  nextId: chat.nextId + 1,
  slots: reply.slots,
  turns: [...chat.turns, { id: chat.nextId, input, reply }]
})
