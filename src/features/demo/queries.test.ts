import { describe, expect, test } from 'bun:test'

import { demoUsageSchema } from '@/api/types'
import { demoKeys } from './queries'

describe('demo usage', () => {
  test('parseia um payload valido', () => {
    const payload = {
      limit: 20,
      remaining: 20,
      resetsAt: '2026-10-20T03:00:00.000Z',
      used: 0
    }

    expect(demoUsageSchema.parse(payload)).toEqual(payload)
  })

  test('rejeita payload sem remaining', () => {
    const result = demoUsageSchema.safeParse({
      limit: 1,
      used: 0
    })

    expect(result.success).toBe(false)
  })

  test('rejeita payload sem resetsAt', () => {
    const result = demoUsageSchema.safeParse({
      limit: 20,
      remaining: 20,
      used: 0
    })

    expect(result.success).toBe(false)
  })

  test('a chave de uso e demo/usage', () => {
    expect(demoKeys.usage).toEqual(['demo', 'usage'])
  })
})
