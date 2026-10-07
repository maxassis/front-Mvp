import { useState } from 'react'
import type { ComponentProps } from 'react'
import { FileText, Trash2 } from 'lucide-react'

import type { RagFile } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useRemoveFile } from '@/features/files/mutations'

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>

const formatBytes = (bytes: number | null): string => {
  if (bytes === null) {
    return '—'
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * O status e string aberta porque `upload_status` e varchar no banco. Chave
 * desconhecida cai no braco `Desconhecido` em vez de quebrar a lista.
 */
const UPLOAD_STATUS_PRESENTATION: Record<string, { label: string; variant: BadgeVariant }> = {
  failed: { label: 'Falhou', variant: 'destructive' },
  'pending-upload': { label: 'Aguardando envio', variant: 'secondary' },
  processing: { label: 'Processando', variant: 'secondary' },
  queued: { label: 'Na fila', variant: 'secondary' },
  ready: { label: 'Pronto', variant: 'default' }
}

const UNKNOWN_UPLOAD_STATUS = { label: 'Desconhecido', variant: 'outline' } as const

function UploadStatusBadge({ status }: { status: string }) {
  const presentation = UPLOAD_STATUS_PRESENTATION[status] ?? UNKNOWN_UPLOAD_STATUS
  return <Badge variant={presentation.variant}>{presentation.label}</Badge>
}

interface FileListProps {
  files: RagFile[]
  instanceId: string
}

export function FileList({ files, instanceId }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-12 text-center">
        <FileText className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum arquivo enviado ainda</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Arquivos</h2>
      {files.map((file) => (
        <FileRow file={file} instanceId={instanceId} key={file.id} />
      ))}
    </div>
  )
}

interface FileRowProps {
  file: RagFile
  instanceId: string
}

function FileRow({ file, instanceId }: FileRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const remove = useRemoveFile(instanceId)

  const handleRemove = () => {
    remove.mutate(file.id, { onSuccess: () => setIsOpen(false) })
  }

  return (
    <div className="flex items-start justify-between gap-3 border-b px-1 py-3">
      <div className="min-w-0 flex-1">
        <p className="min-w-0 truncate text-sm font-medium">{file.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatBytes(file.size_bytes)}</span>
          <span>{file.mime_type ?? 'application/octet-stream'}</span>
          <span>{file.chunks_count} chunk(s)</span>
        </div>
        <div className="mt-2">
          <UploadStatusBadge status={file.upload_status} />
        </div>
        {file.upload_error ? (
          <p className="mt-1 text-sm text-destructive">{file.upload_error}</p>
        ) : null}
      </div>

      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogTrigger asChild>
          <Button className="shrink-0" size="sm" type="button" variant="destructive">
            <Trash2 /> Remover
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover {file.name}?</DialogTitle>
            <DialogDescription>
              O arquivo sai da base de conhecimento e os trechos indexados sao descartados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button
              disabled={remove.isPending}
              onClick={handleRemove}
              type="button"
              variant="destructive"
            >
              {remove.isPending ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
