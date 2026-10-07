import { queryOptions } from '@tanstack/react-query'

import { api, buildUrl } from '@/api/client'
import { fileListSchema } from '@/api/types'

export const fileKeys = {
  all: ['files'] as const,
  list: (instanceId: string) => [...fileKeys.all, instanceId] as const
}

/** Estados que encerram o processamento; qualquer outro mantem o poll ligado. */
const TERMINAL_UPLOAD_STATUSES: ReadonlySet<string> = new Set(['failed', 'ready'])

export const filesQuery = (instanceId: string) =>
  queryOptions({
    enabled: Boolean(instanceId),
    queryFn: () => api.get(buildUrl('/api/files', { instanceId }), fileListSchema),
    queryKey: fileKeys.list(instanceId),
    // O processamento e assincrono no backend: enquanto houver arquivo fora
    // de estado terminal, a propria query recarrega de tempos em tempos.
    refetchInterval: (query) => {
      const statuses = query.state.data?.files.map((file) => file.upload_status) ?? []
      return statuses.some((status) => !TERMINAL_UPLOAD_STATUSES.has(status)) ? 3_000 : false
    }
  })
