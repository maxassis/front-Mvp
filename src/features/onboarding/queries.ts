import { queryOptions } from '@tanstack/react-query'

import { api, buildUrl } from '@/api/client'
import { onboardingItemListSchema } from '@/api/types'

export const onboardingKeys = {
  all: ['onboarding'] as const,
  items: (instanceId: string) => [...onboardingKeys.all, 'items', instanceId] as const
}

/**
 * Sem filtro `enabled` no servidor: o schema da query usa `z.coerce.boolean()`
 * e a string "false" viraria `true`. O filtro de ativas acontece na tela.
 */
export const onboardingItemsQuery = (instanceId: string) =>
  queryOptions({
    enabled: Boolean(instanceId),
    queryFn: () =>
      api.get(
        buildUrl('/api/onboarding/items', { whatsapp_instance_id: instanceId }),
        onboardingItemListSchema
      ),
    queryKey: onboardingKeys.items(instanceId)
  })
