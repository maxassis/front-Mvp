import type { ChatbotTestMedia } from '@/api/types'

interface ReplyMediaProps {
  media: ChatbotTestMedia
}

const GOOGLE_MAPS_QUERY = 'https://www.google.com/maps/search/?api=1&query'

/** Localizacao abre o mapa do endereco; o link nativo do WhatsApp nao existe na web. */
const mapsUrl = (latitude: number, longitude: number): string =>
  `${GOOGLE_MAPS_QUERY}=${latitude},${longitude}`

/**
 * Previa da midia que o bot devolveu, pelo mesmo contrato do WhatsApp:
 * imagem, video, documento com link de download e localizacao com mapa.
 * O `type` da uniao discriminada decide o render; sem resto de switch.
 */
export function ReplyMedia({ media }: ReplyMediaProps) {
  switch (media.type) {
    case 'image':
      return (
        <img
          alt={media.caption ?? media.filename ?? 'Imagem enviada pelo bot'}
          className="max-h-64 w-full rounded-md object-contain"
          src={media.url}
        />
      )
    case 'video':
      return <video className="max-h-64 w-full rounded-md" controls src={media.url} />
    case 'document':
      return (
        <a
          className="text-sm underline"
          href={media.url}
          rel="noopener"
          target="_blank"
        >
          {media.filename ?? 'Documento'}
        </a>
      )
    case 'location':
      return (
        <a
          className="text-sm underline"
          href={mapsUrl(media.latitude, media.longitude)}
          rel="noopener"
          target="_blank"
        >
          {media.title !== '' ? media.title : 'Ver no mapa'}
        </a>
      )
  }
}
