export interface LoginSearch {
  error?: string
  redirect?: string
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
 * `redirect` aceita apenas caminhos internos: `window.location` com URL
 * absoluta seria open redirect. Vive fora de `login.tsx` porque `bun test`
 * nao resolve o alias `@/` do app, e a rota importa componentes que dependem
 * dele.
 */
export const validateLoginSearch = (search: Record<string, unknown>): LoginSearch => {
  const redirect =
    typeof search.redirect === 'string' && search.redirect.startsWith('/') ? search.redirect : undefined
  return typeof search.error === 'string'
    ? { error: search.error, redirect }
    : { redirect }
}
