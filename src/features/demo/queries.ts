import { queryOptions } from '@tanstack/react-query'

import { api } from '@/api/client'
import { demoUsageSchema } from '@/api/types'

export const demoKeys = {
  usage: ['demo', 'usage'] as const
}

/**
 * Cota do demo (1 teste por conta, para sempre). Fonte da verdade do estado
 * esgotado: o 429 nao distingue o teste ja usado do burst do tier rag.
 */
export const demoUsageQuery = queryOptions({
  queryFn: () => api.get('/api/demo/chatbot/usage', demoUsageSchema),
  queryKey: demoKeys.usage
})
