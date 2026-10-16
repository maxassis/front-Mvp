import { describe, expect, it } from 'bun:test'

import {
  leadDisplayName,
  leadInitials,
  leadIntent,
  leadLastMessagePreview,
  leadLastMessageTime,
  leadPhone,
  leadSubtitle
} from './lead-display'
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

describe('leadInitials', () => {
  it('usa as iniciais do nome quando existe', () => {
    expect(leadInitials({ chatId: '', name: 'Maria Souza', phone: null })).toBe('MS')
    expect(leadInitials({ chatId: '', name: 'Ana Paula Lima', phone: null })).toBe('AL')
  })

  it('usa uma letra quando o nome tem uma palavra so', () => {
    expect(leadInitials({ chatId: '', name: 'Maria', phone: null })).toBe('M')
  })

  it('cai para os digitos do telefone quando nao ha nome', () => {
    expect(
      leadInitials({ chatId: '5511990000001@c.us', name: null, phone: '5511990000001' })
    ).toBe('55')
  })

  it('cai para C quando nao ha nome nem telefone', () => {
    expect(leadInitials({ chatId: '123456@lid', name: null, phone: null })).toBe('C')
    expect(leadInitials({ chatId: '', name: '   ', phone: null })).toBe('C')
  })
})

describe('leadLastMessagePreview', () => {
  it('mostra o texto da mensagem quando existe', () => {
    expect(
      leadLastMessagePreview({
        lastMessage: {
          direction: 'inbound',
          messageType: 'text',
          receivedAt: '2026-06-10T09:30:00Z',
          text: 'Oi, tudo bem?'
        }
      })
    ).toBe('Oi, tudo bem?')
  })

  it('prefixa Voce quando a mensagem e do atendente', () => {
    expect(
      leadLastMessagePreview({
        lastMessage: {
          direction: 'outbound',
          messageType: 'text',
          receivedAt: '2026-06-10T09:30:00Z',
          text: 'Ja te respondo'
        }
      })
    ).toBe('Voce: Ja te respondo')
  })

  it('usa rotulo por tipo de midia quando nao ha texto', () => {
    const preview = (messageType: string, direction = 'inbound') =>
      leadLastMessagePreview({
        lastMessage: { direction, messageType, receivedAt: '2026-06-10T09:30:00Z', text: null }
      })
    expect(preview('image')).toBe('Foto')
    expect(preview('audio')).toBe('Audio')
    expect(preview('video')).toBe('Video')
    expect(preview('document')).toBe('Documento')
    expect(preview('sticker')).toBe('Figurinha')
    expect(preview('location')).toBe('Localizacao')
    expect(preview('text')).toBe('Mensagem')
    expect(preview('image', 'outbound')).toBe('Voce: Foto')
  })

  it('devolve null quando o lead nao tem mensagem', () => {
    expect(leadLastMessagePreview({ lastMessage: null })).toBeNull()
  })
})

describe('leadLastMessageTime', () => {
  const conversation = (lastMessageAt: string | null) => ({
    chatId: '5511990000001@c.us',
    chatType: 'user',
    createdAt: '2026-01-01T00:00:00Z',
    id: 'conv-1',
    instanceId: 'inst-1',
    lastMessageAt,
    status: 'active'
  })

  const now = new Date(2026, 5, 10, 12, 0)

  it('mostra HH:mm quando a mensagem e de hoje', () => {
    expect(
      leadLastMessageTime(
        {
          conversation: conversation(null),
          lastMessage: {
            direction: 'inbound',
            messageType: 'text',
            receivedAt: new Date(2026, 5, 10, 9, 30).toISOString(),
            text: 'oi'
          },
          updatedAt: '2026-06-10T12:00:00Z'
        },
        now
      )
    ).toBe('09:30')
  })

  it('mostra dd/MM quando a mensagem e de outro dia', () => {
    expect(
      leadLastMessageTime(
        {
          conversation: conversation(null),
          lastMessage: {
            direction: 'inbound',
            messageType: 'text',
            receivedAt: new Date(2026, 5, 3, 9, 30).toISOString(),
            text: 'oi'
          },
          updatedAt: '2026-06-10T12:00:00Z'
        },
        now
      )
    ).toBe('03/06')
  })

  it('cai para a conversa e depois para o lead', () => {
    expect(
      leadLastMessageTime(
        {
          conversation: conversation(new Date(2026, 5, 10, 8, 5).toISOString()),
          lastMessage: null,
          updatedAt: '2026-06-10T12:00:00Z'
        },
        now
      )
    ).toBe('08:05')

    expect(
      leadLastMessageTime(
        {
          conversation: conversation(null),
          lastMessage: null,
          updatedAt: new Date(2026, 5, 9, 7, 0).toISOString()
        },
        now
      )
    ).toBe('09/06')
  })
})
