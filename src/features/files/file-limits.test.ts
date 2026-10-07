import { describe, expect, it } from 'bun:test'

import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_BYTES,
  MAX_FILES_PER_BATCH,
  extensionOf,
  rejectionMessage,
  validateSelection
} from './file-limits'

const file = (name: string, size = 1024) => ({ name, size })

describe('extensionOf', () => {
  it('normaliza a caixa da extensao', () => {
    expect(extensionOf('relatorio.PDF')).toBe('pdf')
  })

  it('pega a ultima extensao e rejeita sem ponto, ponto inicial e ponto final', () => {
    expect(extensionOf('archive.tar.md')).toBe('md')
    expect(extensionOf('sem-extensao')).toBeNull()
    expect(extensionOf('.env')).toBeNull()
    expect(extensionOf('nome.')).toBeNull()
  })
})

describe('validateSelection', () => {
  it('espelha os limites do backend', () => {
    expect(MAX_FILE_BYTES).toBe(2 * 1024 * 1024)
    expect(MAX_FILES_PER_BATCH).toBe(10)
    expect([...ALLOWED_EXTENSIONS].sort()).toEqual(['md', 'pdf', 'txt'])
  })

  it('aceita lote valido e o limite exato de 2 MB', () => {
    expect(validateSelection([file('a.pdf'), file('b.TXT')])).toBeNull()
    expect(validateSelection([file('cheio.pdf', MAX_FILE_BYTES)])).toBeNull()
  })

  it('rejeita lote acima de 10 em vez de truncar em silencio', () => {
    const files = Array.from({ length: 11 }, (_, index) => file(`f${index}.pdf`))
    expect(validateSelection(files)).toEqual({ kind: 'too-many', limit: 10 })
  })

  it('aponta os arquivos acima do limite', () => {
    expect(validateSelection([file('ok.pdf'), file('grande.pdf', MAX_FILE_BYTES + 1)])).toEqual({
      kind: 'too-large',
      names: ['grande.pdf']
    })
  })

  it('aponta os tipos nao suportados', () => {
    expect(validateSelection([file('foto.png'), file('doc.pdf')])).toEqual({
      kind: 'unsupported-type',
      names: ['foto.png']
    })
  })
})

describe('rejectionMessage', () => {
  it('descreve cada motivo em portugues sem acento', () => {
    expect(rejectionMessage({ kind: 'too-many', limit: 10 })).toContain('10')
    expect(rejectionMessage({ kind: 'too-large', names: ['a.pdf'] })).toContain('a.pdf')
    expect(rejectionMessage({ kind: 'unsupported-type', names: ['a.exe'] })).toContain('a.exe')
  })
})
