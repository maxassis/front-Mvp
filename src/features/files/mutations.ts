import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiJson } from '@/api/client'
import { deleteFileResponseSchema } from '@/api/types'
import { fileKeys } from '@/features/files/queries'
import {
  confirmUpload,
  putToSignedUrl,
  requestPresignedUploads
} from '@/features/files/upload'

const notifyError = (error: unknown): void => {
  toast.error(error instanceof Error ? error.message : 'Operacao falhou')
}

export interface UploadFilesInput {
  files: File[]
}

/**
 * Presign em lote, depois um arquivo por vez para apontar o erro exatamente
 * onde falhou. Falha parcial joga `Error` com a lista, mas a lista de
 * arquivos invalida de qualquer jeito para mostrar o que ja subiu.
 */
export const useUploadFiles = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ files }: UploadFilesInput) => {
      const presigned = await requestPresignedUploads(
        instanceId,
        files.map((file) => ({
          filename: file.name,
          mimetype: file.type || 'application/octet-stream',
          sizeBytes: file.size
        }))
      )

      const failures: string[] = []
      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        const target = presigned[index]
        if (!file || !target) {
          failures.push(file?.name ?? `arquivo ${index + 1}`)
          continue
        }
        try {
          await putToSignedUrl(target.signedUrl, file, file.type || 'application/octet-stream')
          await confirmUpload(target.fileId)
        } catch (error) {
          failures.push(
            `${file.name}: ${error instanceof Error ? error.message : 'erro desconhecido'}`
          )
        }
      }

      if (failures.length > 0) {
        throw new Error(`Falhas no envio: ${failures.join('; ')}`)
      }
    },
    onError: notifyError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: fileKeys.list(instanceId) })
  })
}

export const useRemoveFile = (instanceId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) =>
      apiJson(`/api/files/${fileId}`, deleteFileResponseSchema, { method: 'DELETE' }),
    onError: notifyError,
    // A lista recarrega em qualquer desfecho: se a rede falhar depois de o
    // backend apagar, a tela reflete a verdade do servidor em vez de manter
    // o arquivo visivel como se nada tivesse acontecido.
    onSettled: () => queryClient.invalidateQueries({ queryKey: fileKeys.list(instanceId) })
  })
}
