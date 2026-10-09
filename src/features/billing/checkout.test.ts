import { afterEach, describe, expect, it } from 'bun:test'

import {
  absoluteUrl,
  beginCheckoutHandoff,
  checkoutSuccessPollMs,
  checkoutUrls,
  resetCheckoutHandoff
} from './checkout'

afterEach(() => {
  resetCheckoutHandoff()
})

describe('absoluteUrl', () => {
  it('concatena origem e caminho', () => {
    expect(absoluteUrl('/plano', 'https://app.test')).toBe('https://app.test/plano')
  })
})

describe('checkoutUrls', () => {
  it('monta as URLs absolutas de retorno a partir da origem', () => {
    const original = globalThis.window
    globalThis.window = {
      location: { origin: 'https://app.test' }
    } as unknown as Window & typeof globalThis

    try {
      expect(checkoutUrls()).toEqual({
        cancelUrl: 'https://app.test/plano?status=cancelado',
        successUrl: 'https://app.test/plano?status=sucesso'
      })
    } finally {
      globalThis.window = original
    }
  })
})

describe('beginCheckoutHandoff', () => {
  it('deixa passar uma vez e trava depois', () => {
    expect(beginCheckoutHandoff()).toBe(true)
    expect(beginCheckoutHandoff()).toBe(false)
  })

  it('reset libera o disparo de novo', () => {
    expect(beginCheckoutHandoff()).toBe(true)
    resetCheckoutHandoff()
    expect(beginCheckoutHandoff()).toBe(true)
  })
})

describe('checkoutSuccessPollMs', () => {
  it('para quando ja ha assinatura ativa', () => {
    expect(checkoutSuccessPollMs(0, true)).toBe(false)
    expect(checkoutSuccessPollMs(29_000, true)).toBe(false)
  })

  it('polla a cada 4s dentro do orcamento', () => {
    expect(checkoutSuccessPollMs(0, false)).toBe(4_000)
    expect(checkoutSuccessPollMs(29_999, false)).toBe(4_000)
  })

  it('para no limite do orcamento', () => {
    expect(checkoutSuccessPollMs(30_000, false)).toBe(false)
    expect(checkoutSuccessPollMs(60_000, false)).toBe(false)
  })
})
