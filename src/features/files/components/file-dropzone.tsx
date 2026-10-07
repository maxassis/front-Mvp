import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  rejectionMessage,
  validateSelection
} from '@/features/files/file-limits'
import { useUploadFiles } from '@/features/files/mutations'

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface FileDropzoneProps {
  instanceId: string
}

export function FileDropzone({ instanceId }: FileDropzoneProps) {
  const upload = useUploadFiles(instanceId)
  const [selected, setSelected] = useState<File[]>([])
  const [selectionError, setSelectionError] = useState<string | null>(null)

  const handleSelection = (input: HTMLInputElement) => {
    const picked = Array.from(input.files ?? [])
    const rejection = validateSelection(picked)
    if (rejection) {
      setSelectionError(rejectionMessage(rejection))
    } else {
      setSelected(picked)
      setSelectionError(null)
    }
    input.value = ''
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (selected.length === 0) {
      return
    }
    upload.mutate(
      { files: selected },
      {
        onSuccess: () => {
          setSelected([])
          setSelectionError(null)
        }
      }
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="files-picker">Selecione arquivos</Label>
        <Input
          accept=".pdf,.txt,.md"
          id="files-picker"
          multiple
          onChange={(event) => handleSelection(event.currentTarget)}
          type="file"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        PDF, TXT ou MD ate 2 MB cada. O upload vai direto ao storage e o processamento roda em
        fila.
      </p>

      {selectionError ? <p className="text-sm text-destructive">{selectionError}</p> : null}

      {selected.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <p className="font-medium">{selected.length} arquivo(s) selecionado(s)</p>
            <p className="text-muted-foreground">
              Total: {formatBytes(selected.reduce((sum, file) => sum + file.size, 0))}
            </p>
          </div>
          {selected.map((file) => (
            <div className="flex items-center justify-between gap-2 border-b py-2" key={`${file.name}-${file.lastModified}`}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <Button
                onClick={() => setSelected((current) => current.filter((item) => item !== file))}
                size="sm"
                type="button"
                variant="outline"
              >
                Remover
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button className="w-full" disabled={upload.isPending || selected.length === 0} type="submit">
        {upload.isPending ? 'Enviando...' : 'Enviar arquivos'}
      </Button>
    </form>
  )
}
