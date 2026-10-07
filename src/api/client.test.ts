import { afterAll, describe, expect, it } from 'bun:test'
import { z } from 'zod'

import { ApiError, apiJson, buildUrl } from './client'
import {
  confirmUploadResponseSchema,
  deleteFileResponseSchema,
  fileListSchema,
  leadSchema,
  onboardingItemListSchema,
  onboardingItemSchema,
  presignResponseSchema,
  ragFileSchema,
  readQrPayload,
  readWahaStatus
} from './types'

describe('ApiError', () => {
  it('junta as mensagens de validacao em uma so string', () => {
    const error = new ApiError({ code: 'Bad Request', issues: ['campo a', 'campo b'], status: 400 })
    expect(error.message).toBe('campo a campo b')
    expect(error.issues).toEqual(['campo a', 'campo b'])
  })

  it('usa o status quando nao ha mensagem', () => {
    const error = new ApiError({ code: 'X', issues: [], status: 503 })
    expect(error.message).toBe('Erro 503')
  })

  it('reconhece 401 e o codigo de e-mail nao verificado', () => {
    expect(new ApiError({ code: 'X', issues: [], status: 401 }).isUnauthorized).toBe(true)
    expect(
      new ApiError({ code: 'EMAIL_NOT_VERIFIED', issues: [], status: 403 }).isEmailNotVerified
    ).toBe(true)
  })
})

describe('buildUrl', () => {
  it('preserva a query que ja existe', () => {
    expect(buildUrl('/api/leads/1/messages', { include_history: 'true' })).toBe(
      '/api/leads/1/messages?include_history=true'
    )
  })

  it('omite parametro undefined em vez de mandar a string "undefined"', () => {
    expect(buildUrl('/api/leads', { instance_id: 'abc', status: undefined })).toBe(
      '/api/leads?instance_id=abc'
    )
  })

  it('devolve o path intacto sem query', () => {
    expect(buildUrl('/api/leads', {})).toBe('/api/leads')
  })
})

describe('leadSchema', () => {
  const valid = {
    chatId: '5511990000001@c.us',
    conversation: {
      chatId: '5511990000001@c.us',
      chatType: 'user',
      createdAt: '2026-01-01T00:00:00Z',
      id: 'conv-1',
      instanceId: 'inst-1',
      lastMessageAt: null,
      status: 'open'
    },
    conversationId: 'conv-1',
    createdAt: '2026-01-01T00:00:00Z',
    email: null,
    id: 'lead-1',
    intent: 'Corte de cabelo',
    isReturn: false,
    name: 'Maria Souza',
    phone: '5511990000001',
    previousLeadId: null,
    status: 'new',
    updatedAt: '2026-01-02T00:00:00Z'
  }

  it('aceita o payload do backend', () => {
    expect(leadSchema.parse(valid).name).toBe('Maria Souza')
  })

  it('rejeita status fora de new|assigned|closed em vez de mascarar como Pendente', () => {
    expect(leadSchema.safeParse({ ...valid, status: 'archived' }).success).toBe(false)
  })

  it('rejeita lead sem a conversa aninhada', () => {
    const { conversation, ...withoutConversation } = valid
    void conversation
    expect(leadSchema.safeParse(withoutConversation).success).toBe(false)
  })
})

describe('readQrPayload', () => {
  it('prefere base64 e monta o data uri', () => {
    expect(readQrPayload({ base64: 'AAA' })).toEqual({
      kind: 'data-uri',
      src: 'data:image/png;base64,AAA'
    })
  })

  it('usa data com mimetype quando nao ha base64', () => {
    expect(readQrPayload({ data: 'BBB', mimetype: 'image/jpeg' })).toEqual({
      kind: 'data-uri',
      src: 'data:image/jpeg;base64,BBB'
    })
  })

  it('devolve a url como remota quando e o unico formato', () => {
    expect(readQrPayload({ url: 'http://waha/qr.png' })).toEqual({
      kind: 'remote',
      src: 'http://waha/qr.png'
    })
  })

  it('devolve null quando nenhum formato serve', () => {
    expect(readQrPayload({})).toBeNull()
    expect(readQrPayload(null)).toBeNull()
    expect(readQrPayload('lixo')).toBeNull()
    expect(readQrPayload({ base64: '   ' })).toBeNull()
  })
})

describe('readWahaStatus', () => {
  it('le o status quando e string', () => {
    expect(readWahaStatus({ status: 'WORKING' })).toBe('WORKING')
  })

  it('devolve null quando o status nao e string', () => {
    expect(readWahaStatus({ status: 200 })).toBeNull()
    expect(readWahaStatus({})).toBeNull()
  })
})

/** Bun tipa `fetch` com `preconnect`, que um stub de teste nao implementa. */
const stubFetch = (
  handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
) => Object.assign(handler, { preconnect: () => {} }) as unknown as typeof fetch

describe('apiJson', () => {
  const originalFetch = globalThis.fetch

  afterAll(() => {
    globalThis.fetch = originalFetch
  })

  it('exige o schema e devolve o tipo parseado', async () => {
    globalThis.fetch = stubFetch(async () =>
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' }
      }))

    const parsed = await apiJson('/api/qualquer', z.object({ ok: z.boolean() }))
    expect(parsed).toEqual({ ok: true })
  })

  it('manda credentials e o Content-Type do corpo', async () => {
    let seen: RequestInit | undefined
    globalThis.fetch = stubFetch(async (_input, init) => {
      seen = init
      return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } })
    })

    await apiJson('/api/leads', z.object({}), { body: '{}' })
    expect(seen?.credentials).toBe('include')
  })

  it('transforma o envelope de erro em ApiError', async () => {
    expect.assertions(3)
    globalThis.fetch = stubFetch(async () =>
      new Response(JSON.stringify({ error: 'Bad Request', message: ['a', 'b'], statusCode: 400 }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }))

    try {
      await apiJson('/api/leads', z.array(leadSchema))
    } catch (error) {
      const apiError = error as ApiError
      expect(apiError).toBeInstanceOf(ApiError)
      expect(apiError.status).toBe(400)
      expect(apiError.message).toBe('a b')
    }
  })
})

describe('onboardingItemSchema', () => {
  const valid = {
    answer: 'Atender com proximidade',
    answerJson: null,
    createdAt: '2026-01-01T00:00:00Z',
    enabled: true,
    fieldKey: 'assistant_persona',
    id: 'item-1',
    question: 'Quem e o assistente?',
    required: true,
    sortOrder: 10,
    updatedAt: '2026-01-02T00:00:00Z',
    userId: 'user-1',
    whatsappInstanceId: 'inst-1'
  }

  it('aceita a linha em camelCase com resposta nula', () => {
    expect(onboardingItemSchema.parse({ ...valid, answer: null }).answer).toBeNull()
  })

  it('a lista e array solto, nao envelope', () => {
    expect(onboardingItemListSchema.parse([valid])).toHaveLength(1)
    expect(onboardingItemListSchema.safeParse({ items: [valid] }).success).toBe(false)
  })
})

describe('ragFileSchema', () => {
  const valid = {
    chunks_count: 4,
    created_at: '2026-01-01T00:00:00Z',
    id: 'file-1',
    indexed_at: null,
    mime_type: 'application/pdf',
    name: 'cardapio.pdf',
    size_bytes: 1024,
    storage_path: 'user-1/inst-1/cardapio.pdf',
    upload_batch_id: null,
    upload_error: null,
    upload_status: 'ready'
  }

  it('aceita a linha em snake_case', () => {
    expect(ragFileSchema.parse(valid).name).toBe('cardapio.pdf')
  })

  it('tolera status que ainda nao existe no cliente', () => {
    expect(ragFileSchema.parse({ ...valid, upload_status: 'quarantined' }).upload_status).toBe(
      'quarantined'
    )
  })

  it('a lista exige o envelope files e rejeita array solto', () => {
    expect(fileListSchema.parse({ files: [valid] }).files).toHaveLength(1)
    expect(fileListSchema.safeParse([valid]).success).toBe(false)
  })
})

describe('presignResponseSchema', () => {
  it('aceita o lote com um arquivo assinado', () => {
    const parsed = presignResponseSchema.parse({
      batch_id: 'batch-1',
      files: [
        {
          file_id: 'file-1',
          signed_url: 'https://storage/put',
          storage_path: 'user-1/inst-1/a.pdf',
          token: 'tok'
        }
      ]
    })
    expect(parsed.files[0]?.file_id).toBe('file-1')
  })
})

describe('confirmUploadResponseSchema', () => {
  it('aceita o status devolvido pelo confirm', () => {
    expect(confirmUploadResponseSchema.parse({ status: 'queued' }).status).toBe('queued')
  })
})

describe('deleteFileResponseSchema', () => {
  it('so aceita success true', () => {
    expect(deleteFileResponseSchema.parse({ success: true }).success).toBe(true)
    expect(deleteFileResponseSchema.safeParse({ success: false }).success).toBe(false)
  })
})