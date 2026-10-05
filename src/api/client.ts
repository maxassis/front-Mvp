import type { z } from 'zod'

/**
 * Envelope de erro do backend (apps/backend/src/http/error-handler.ts).
 * `message` chega como string no HttpError e como string[] na falha de
 * validacao do Elysia, entao a normalizacao acontece uma vez aqui e o resto do
 * app nunca precisa checar o tipo da mensagem.
 */
interface ErrorEnvelope {
  error?: unknown
  message?: unknown
  statusCode?: unknown
}

export class ApiError extends Error {
  readonly code: string
  readonly issues: string[]
  readonly status: number

  constructor(input: { code: string; issues: string[]; status: number }) {
    super(input.issues.join(' ') || `Erro ${input.status}`)
    this.name = 'ApiError'
    this.code = input.code
    this.issues = input.issues
    this.status = input.status
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** Sinal enviado pelo Better Auth quando a conta ainda nao verificou o e-mail. */
  get isEmailNotVerified(): boolean {
    return this.code === 'EMAIL_NOT_VERIFIED'
  }
}

const toApiError = (status: number, body: unknown): ApiError => {
  const envelope: ErrorEnvelope =
    typeof body === 'object' && body !== null ? (body as ErrorEnvelope) : {}

  const rawIssues = Array.isArray(envelope.message)
    ? envelope.message.filter((item): item is string => typeof item === 'string')
    : typeof envelope.message === 'string'
      ? [envelope.message]
      : []

  return new ApiError({
    code: typeof envelope.error === 'string' ? envelope.error : 'RequestError',
    issues: rawIssues,
    status
  })
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * Chamado quando a API responde 401 fora do fluxo de sessao. O guard de rota so
 * roda na navegacao, entao sem esteAviso um cookie que morre no meio do uso
 * deixa a tela presa mostrando dado velho e um alerta de erro, sem caminho para
 * voltar ao login.
 */
let onUnauthorized: (() => void) | null = null

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  onUnauthorized = handler
}

const request = async (path: string, init: RequestInit): Promise<Response> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include'
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const error = toApiError(response.status, body)

    // O proprio sign-in responde 401 com credencial errada; nesse caso quem trata
    // e a tela de login, nao um logout global.
    if (error.isUnauthorized && !path.startsWith('/api/auth/')) {
      onUnauthorized?.()
    }

    throw error
  }

  return response
}

const jsonBody = (body: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})

/** Leitura e escrita que devolvem corpo. O schema valida na fronteira. */
export const apiJson = async <S extends z.ZodType>(
  path: string,
  schema: S,
  init: RequestInit = {}
): Promise<z.output<S>> => {
  const response = await request(path, init)
  return schema.parse(await response.json()) as z.output<S>
}

/** Escrita sem corpo de volta. Unico 204 do escopo e o DELETE de instancia. */
export const apiVoid = async (path: string, init: RequestInit = {}): Promise<void> => {
  await request(path, init)
}

export const api = {
  delete: (path: string) => apiVoid(path, { method: 'DELETE' }),
  get: <S extends z.ZodType>(path: string, schema: S) => apiJson(path, schema),
  patch: <S extends z.ZodType>(path: string, schema: S, body: unknown) =>
    apiJson(path, schema, { ...jsonBody(body), method: 'PATCH' }),
  post: <S extends z.ZodType>(path: string, schema: S, body?: unknown) =>
    apiJson(path, schema, {
      ...(body === undefined ? {} : jsonBody(body)),
      method: 'POST'
    })
}

export const buildUrl = (path: string, query?: Record<string, string | undefined>): string => {
  if (!query) {
    return path
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, value)
    }
  }

  const search = params.toString()
  return search ? `${path}?${search}` : path
}
