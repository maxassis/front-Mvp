import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FileDropzone } from '@/features/files/components/file-dropzone'
import { FileList } from '@/features/files/components/file-list'
import { filesQuery } from '@/features/files/queries'
import { instancesQuery } from '@/features/instances/queries'
import { useUiStore } from '@/stores/ui-store'

const filesSearchSchema = z.object({
  instanceId: z.string().optional()
})

export const Route = createFileRoute('/_authed/files')({
  component: FilesPage,
  validateSearch: filesSearchSchema
})

function FilesPage() {
  // Mesmo arranjo do /leads: instancia pela URL com o Zustand de reserva.
  const searchInstanceId = Route.useSearch({ select: (search) => search.instanceId })
  const selectedInstanceId = useUiStore((state) => state.selectedInstanceId)
  const instanceId = searchInstanceId ?? selectedInstanceId

  const instances = useQuery(instancesQuery)
  const files = useQuery(filesQuery(instanceId ?? ''))

  if (!instanceId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Building2 className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Nenhuma instancia selecionada</p>
        <p className="text-sm text-muted-foreground">
          Volte para Conexoes e abra os arquivos de uma instancia
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/">Ver conexoes</Link>
        </Button>
      </div>
    )
  }

  const instance = (instances.data ?? []).find((current) => current.id === instanceId)

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-semibold">Arquivos da instancia</h1>
        <p className="text-sm text-muted-foreground">
          {instance
            ? `${instance.instanceName ?? instance.providerInstanceId}${instance.phoneNumber ? ` - ${instance.phoneNumber}` : ''}`
            : 'Carregue arquivos para a base de conhecimento'}
        </p>
      </div>

      {files.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Nao foi possivel carregar os arquivos. {files.error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {instances.isPending || files.isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton className="h-16 w-full" key={index} />
          ))}
        </div>
      ) : instances.isSuccess && !instance ? (
        <p className="text-sm text-muted-foreground">Instancia nao encontrada</p>
      ) : (
        <>
          <FileDropzone instanceId={instanceId} />
          <FileList files={files.data?.files ?? []} instanceId={instanceId} />
        </>
      )}
    </div>
  )
}
