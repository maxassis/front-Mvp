import { describe, expect, it } from 'bun:test'

import { leadDisplayName, leadIntent, leadPhone, leadSubtitle } from './lead-display'
import { leadLifecycle } from './lead-lifecycle'

describe('formatPhone', () => {
  it('formata celular com codigo de pais', () => {
    expect(leadPhone({ chatId: '', phone: '5511990000001' })).toBe('+55 (11) 99000-0001')
  })

  it('formata fixo com codigo de pais', () => {
    expect(leadPhone({ chatId: '', phone: '551199999999' })).toBe('(11) 9999-9999')
  })

  it('formata numero nacional sem codigo de pais', () => {
    expect(leadPhone({ chatId: '', phone: '11999999999' })).toBe('(11) 99999-9999')
    expect(leadPhone({ chatId: '', phone: '1133334444' })).toBe('(11) 3333-4444')
  })

  it('nao confunde o DDD 55 com o codigo de pais', () => {
    expect(leadPhone({ chatId: '', phone: '55999999999' })).toBe('(55) 99999-9999')
  })

  it('tira sufixo e mascara antes de formatar', () => {
    expect(leadPhone({ chatId: '', phone: '+55 (11) 99000-0001' })).toBe('+55 (11) 99000-0001')
  })

  it('usa o telefone do chatId quando o lead nao tem phone', () => {
    expect(leadPhone({ chatId: '5511900000001@c.us', phone: null })).toBe('+55 (11) 90000-0001')
  })

  it('devolve null para grupo e para lid, que nao tem telefone', () => {
    expect(leadPhone({ chatId: '551199999999@g.us', phone: null })).toBeNull()
    expect(leadPhone({ chatId: '123456789@lid', phone: null })).toBeNull()
  })

  it('devolve null quando nao ha digito suficiente', () => {
    expect(leadPhone({ chatId: '', phone: '123' })).toBeNull()
    expect(leadPhone({ chatId: '', phone: null })).toBeNull()
  })
})

describe('leadIntent', () => {
  it('esconde o interesse placeholder do backend', () => {
    expect(leadIntent({ intent: 'Interesse geral' })).toBeNull()
    expect(leadIntent({ intent: '  Interesse geral  ' })).toBeNull()
    expect(leadIntent({ intent: '' })).toBeNull()
    expect(leadIntent({ intent: null })).toBeNull()
  })

  it('mantem o interesse extraido pelo LLM', () => {
    expect(leadIntent({ intent: 'Corte de cabelo' })).toBe('Corte de cabelo')
  })
})

describe('leadDisplayName', () => {
  it('prefere o nome quando existe', () => {
    expect(leadDisplayName({ chatId: '5511990000001@c.us', name: 'Maria Souza', phone: null })).toBe(
      'Maria Souza'
    )
  })

  it('cai para o telefone quando nao ha nome', () => {
    expect(leadDisplayName({ chatId: '5511990000001@c.us', name: null, phone: '5511990000001' })).toBe(
      '+55 (11) 99000-0001'
    )
  })

  it('cai para Cliente quando nao ha nome nem telefone', () => {
    expect(leadDisplayName({ chatId: '123456@lid', name: null, phone: null })).toBe('Cliente')
  })
})

describe('leadSubtitle', () => {
  it('junta telefone e interesse', () => {
    expect(leadSubtitle({ chatId: '', intent: 'Corte', phone: '5511990000001' })).toBe(
      '+55 (11) 99000-0001 · Corte'
    )
  })

  it('omite o que nao existe', () => {
    expect(leadSubtitle({ chatId: '', intent: 'Corte', phone: null })).toBe('Corte')
    expect(leadSubtitle({ chatId: '', intent: 'Interesse geral', phone: null })).toBe('Sem telefone')
  })
})

describe('leadLifecycle', () => {
  it('so permite assumir e nao envia enquanto o lead e pendente', () => {
    const lifecycle = leadLifecycle('new')
    expect(lifecycle.canAssign).toBe(true)
    expect(lifecycle.canSendMessage).toBe(false)
    expect(lifecycle.botIsAnswering).toBe(true)
  })

  it('libera o composer em atendimento', () => {
    const lifecycle = leadLifecycle('assigned')
    expect(lifecycle.canSendMessage).toBe(true)
    expect(lifecycle.canAssign).toBe(false)
    expect(lifecycle.canClose).toBe(true)
    expect(lifecycle.botIsAnswering).toBe(false)
  })

  it('fecha o lead como terminal', () => {
    const lifecycle = leadLifecycle('closed')
    expect(lifecycle.canClose).toBe(false)
    expect(lifecycle.canAssign).toBe(false)
    expect(lifecycle.canSendMessage).toBe(false)
    expect(lifecycle.botIsAnswering).toBe(true)
  })
})