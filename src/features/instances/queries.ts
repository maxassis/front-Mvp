import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { api } from '@/api/client'
import { whatsappInstanceSchema } from '@/api/types'

export const instanceKeys = {
  all: ['instances'] as const,
  detail: (instanceId: string) => [...instanceKeys.all, instanceId] as const
}

export const instancesQuery = queryOptions({
  queryFn: () => api.get('/api/whatsapp/instances', z.array(whatsappInstanceSchema)),
  queryKey: instanceKeys.all
})
