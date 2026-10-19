import { queryOptions } from '@tanstack/react-query'

import { api } from '@/api/client'
import { demoUsageSchema } from '@/api/types'

export const demoKeys = {
  usage: ['demo', 'usage'] as const
}

/**
 * Cota diaria do demo (1 teste por conta por dia). Fonte da verdade do estado
 * esgotado: o 429 nao distingue o teto do dia do burst do tier rag.
 */
export const demoUsageQuery = queryOptions({
  queryFn: () => api.get('/api/demo/chatbot/usage', demoUsageSchema),
  queryKey: demoKeys.usage
})
