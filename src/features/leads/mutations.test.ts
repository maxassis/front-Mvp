import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, mock } from 'bun:test'
import { z } from 'zod'

mock.module('@/api/client', () => ({
  api: { get: () => Promise.resolve([]), post: () => Promise.resolve({}) },
  buildUrl: (path: string) => path
}))
mock.module('@/api/types', () => ({
  leadMessageSchema: z.object({}),
  leadSchema: z.object({})
}))
mock.module('sonner', () => ({ toast: { error: () => undefined } }))

const queriesModule = await import('./queries')
mock.module('@/features/leads/queries', () => queriesModule)

const { invalidateLeadCaches } = await import('./mutations')
const { leadKeys } = queriesModule

const seedCaches = (queryClient: QueryClient, instanceId: string, leadId: string): void => {
  for (const status of ['all', 'new', 'assigned', 'closed'] as const) {
    queryClient.setQueryData(leadKeys.list(instanceId, status), [])
  }
  queryClient.setQueryData(leadKeys.byId(leadId), { id: leadId })
  queryClient.setQueryData(leadKeys.messages(leadId), [])
}

const invalidatedKeys = (queryClient: QueryClient): string[] =>
  queryClient
    .getQueryCache()
    .findAll({ predicate: (query) => query.state.isInvalidated })
    .map((query) => JSON.stringify(query.queryKey))

describe('invalidateLeadCaches', () => {
  it('invalida as abas da instancia, o detalhe por id e as mensagens', async () => {
    const queryClient = new QueryClient()
    seedCaches(queryClient, 'inst-1', 'lead-1')

    await invalidateLeadCaches(queryClient, 'inst-1', 'lead-1')

    const keys = invalidatedKeys(queryClient)
    for (const status of ['all', 'new', 'assigned', 'closed'] as const) {
      expect(keys).toContain(JSON.stringify(leadKeys.list('inst-1', status)))
    }
    expect(keys).toContain(JSON.stringify(leadKeys.byId('lead-1')))
    expect(keys).toContain(JSON.stringify(leadKeys.messages('lead-1')))
  })

  it('nao toca a instancia vizinha', async () => {
    const queryClient = new QueryClient()
    seedCaches(queryClient, 'inst-1', 'lead-1')
    seedCaches(queryClient, 'inst-2', 'lead-9')

    await invalidateLeadCaches(queryClient, 'inst-1', 'lead-1')

    const keys = invalidatedKeys(queryClient)
    expect(keys).not.toContain(JSON.stringify(leadKeys.list('inst-2', 'all')))
    expect(keys).not.toContain(JSON.stringify(leadKeys.byId('lead-9')))
  })
})
