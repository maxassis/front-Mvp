/**
 * Espelho cliente das constantes de validacao do backend
 * (rag-files.service.ts: MAX_PRESIGN_ITEMS, MAX_PRESIGN_BYTES,
 * PRESIGN_ALLOWED_EXTENSIONS). Barrar na selecao evita uma ida a API que
 * terminaria em 400 ou 413 de qualquer jeito.
 *
 * Sem imports de `@/`: `bun test` nao resolve o alias do app.
 */

export const MAX_FILE_BYTES = 2 * 1024 * 1024

export const MAX_FILES_PER_BATCH = 10

export const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set(['pdf', 'txt', 'md'])

export const extensionOf = (filename: string): string | null => {
  const dot = filename.lastIndexOf('.')
  if (dot <= 0 || dot === filename.length - 1) {
    return null
  }
  return filename.slice(dot + 1).toLowerCase()
}

export interface FileSelection {
  name: string
  size: number
}

export type SelectionRejection =
  | { kind: 'too-many'; limit: number }
  | { kind: 'too-large'; names: string[] }
  | { kind: 'unsupported-type'; names: string[] }

/**
 * Rejeita em vez de truncar: o backend recusa lote acima de 10 com 400, e
 * descartar arquivo em silencio e perda de dado que o usuario nao percebe.
 */
export const validateSelection = (files: FileSelection[]): SelectionRejection | null => {
  if (files.length > MAX_FILES_PER_BATCH) {
    return { kind: 'too-many', limit: MAX_FILES_PER_BATCH }
  }

  const tooLarge = files.filter((file) => file.size > MAX_FILE_BYTES).map((file) => file.name)
  if (tooLarge.length > 0) {
    return { kind: 'too-large', names: tooLarge }
  }

  const unsupported = files
    .filter((file) => {
      const extension = extensionOf(file.name)
      return !extension || !ALLOWED_EXTENSIONS.has(extension)
    })
    .map((file) => file.name)
  if (unsupported.length > 0) {
    return { kind: 'unsupported-type', names: unsupported }
  }

  return null
}

export const rejectionMessage = (rejection: SelectionRejection): string => {
  switch (rejection.kind) {
    case 'too-many':
      return `Limite de ${rejection.limit} arquivos por envio`
    case 'too-large':
      return `Acima de 2 MB: ${rejection.names.join(', ')}`
    case 'unsupported-type':
      return `Tipo nao suportado, use PDF, TXT ou MD: ${rejection.names.join(', ')}`
  }
}
