export interface PasswordResetSearch {
  email: string
}

/**
 * Validador de `validateSearch` da rota `/forgot-password/verify`.
 *
 * Vive fora do arquivo de rota porque `bun test` nao resolve o alias `@/` do
 * app, e a rota importa componentes que dependem dele.
 */
export const validatePasswordResetSearch = (
  search: Record<string, unknown>
): PasswordResetSearch => ({
  email: typeof search.email === 'string' ? search.email : ''
})
