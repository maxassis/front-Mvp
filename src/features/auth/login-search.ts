export interface LoginSearch {
  error?: string
}

/**
 * Validador de `validateSearch` da rota `/login`.
 *
 * A chave `error` fica ausente quando nao ha erro de callback. Devolver `null`
 * aqui quebra a URL: o Transitioner do TanStack Router, no mount, chama
 * `buildLocation` com `_includeValidateSearch: true` e reescreve o historico
 * quando o href montado diverge do atual, e o stringify do Router serializa
 * `null` como a string `"null"`. O reload em `/login` virava
 * `/login?error=null` sem o usuario ter pedido nada.
 *
 * Vive fora de `login.tsx` porque `bun test` nao resolve o alias `@/` do
 * app, e a rota importa componentes que dependem dele.
 */
export const validateLoginSearch = (search: Record<string, unknown>): LoginSearch =>
  typeof search.error === 'string' ? { error: search.error } : {}
