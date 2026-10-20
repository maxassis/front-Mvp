import { queryOptions } from '@tanstack/react-query'

import { api } from '@/api/client'
import { demoUsageSchema } from '@/api/types'

export const demoKeys = {
  usage: ['demo', 'usage'] as const
}

/**
 * Saldo diario do demo: quantas mensagens a conta ainda tem hoje e quando o
 * saldo renova (meia-noite de Brasilia). O 429 do backend traz o codigo do
 * motivo; o uso traz o numero que resta.
 */
export const demoUsageQuery = queryOptions({
  queryFn: () => api.get('/api/demo/chatbot/usage', demoUsageSchema),
  queryKey: demoKeys.usage
})
