import { api, buildUrl } from '@/api/client'
import { confirmUploadResponseSchema, presignResponseSchema } from '@/api/types'

export interface PresignInput {
  filename: string
  mimetype: string
  sizeBytes: number
}

export interface PresignedUpload {
  fileId: string
  signedUrl: string
}

export const requestPresignedUploads = async (
  instanceId: string,
  files: PresignInput[]
): Promise<PresignedUpload[]> => {
  const presign = await api.post(
    buildUrl('/api/files/presign', { instanceId }),
    presignResponseSchema,
    { files }
  )
  return presign.files.map((file) => ({ fileId: file.file_id, signedUrl: file.signed_url }))
}

/**
 * O PUT vai direto ao storage com a URL assinada, fora da API: nao passa pelo
 * `api` de proposito, porque aquele modulo prefixa tudo com o BASE_URL da API
 * e manda cookie de sessao. Aqui a autenticacao viaja na propria URL assinada.
 */
export const putToSignedUrl = async (
  signedUrl: string,
  file: File,
  mimetype: string
): Promise<void> => {
  const response = await fetch(signedUrl, {
    body: file,
    headers: { 'Content-Type': mimetype },
    method: 'PUT'
  })
  if (!response.ok) {
    throw new Error(`upload direto falhou (${response.status})`)
  }
}

export const confirmUpload = (fileId: string): Promise<{ status: string }> =>
  api.post(`/api/files/${fileId}/confirm`, confirmUploadResponseSchema)
