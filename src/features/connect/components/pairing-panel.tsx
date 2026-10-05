import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import type { QrPayload } from '@/api/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequestPairingCode } from '@/features/connect/mutations'
import { wahaQrQuery, wahaSessionQuery } from '@/features/connect/queries'
import { instanceKeys, instancesQuery } from '@/features/instances/queries'

/** A WAHA troca a imagem mantendo a URL; o carimbo novo derruba o cache do navegador. */
const withCacheBust = (src: string, updatedAt: number): string =>
  `${src}${src.includes('?') ? '&' : '?'}_t=${updatedAt}`

const resolveQrSrc = (payload: QrPayload | null, updatedAt: number): string | null => {
  if (payload === null) {
    return null
  }
  if (payload.kind === 'data-uri') {
    return payload.src
  }
  return withCacheBust(payload.src, updatedAt)
}

interface PairingPanelProps {
  instanceId: string
}

export function PairingPanel({ instanceId }: PairingPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const qr = useQuery(wahaQrQuery(instanceId, true))
  const session = useQuery(wahaSessionQuery(instanceId, true))
  const instances = useQuery(instancesQuery)
  const didNavigate = useRef(false)

  const phoneNumber =
    instances.data?.find((instance) => instance.id === instanceId)?.phoneNumber ?? ''
  const pairingCode = useRequestPairingCode(instanceId, phoneNumber)
  const isWorking = session.data?.isWorking === true
  const qrSrc = resolveQrSrc(qr.data ?? null, qr.dataUpdatedAt)

  useEffect(() => {
    if (!isWorking || didNavigate.current) {
      return
    }
    didNavigate.current = true
    void queryClient
      .invalidateQueries({ queryKey: instanceKeys.all })
      .then(() => navigate({ to: '/' }))
  }, [isWorking, navigate, queryClient])

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Parear WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Escaneie o QR code no aparelho para concluir a conexao
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>QR code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {qr.isError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Nao foi possivel carregar o QR code. {qr.error.message}
                </AlertDescription>
              </Alert>
            ) : qrSrc === null ? (
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="size-52" />
                <p className="text-sm text-muted-foreground">Aguardando o QR code...</p>
              </div>
            ) : (
              <img
                alt="QR code de pareamento do WhatsApp"
                className="size-52 rounded-lg bg-white p-2"
                src={qrSrc}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Codigo de pareamento</CardTitle>
            <CardDescription>Alternativa quando nao da para escanear o QR code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              disabled={pairingCode.isPending || phoneNumber.length === 0}
              onClick={() => pairingCode.mutate()}
              type="button"
              variant="outline"
            >
              {pairingCode.isPending ? 'Gerando codigo...' : 'Gerar codigo de pareamento'}
            </Button>

            {pairingCode.data ? (
              <div className="rounded-lg border bg-muted px-4 py-3 text-center font-mono text-2xl tracking-[0.3em]">
                {pairingCode.data}
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Abra o WhatsApp em &quot;Dispositivos conectados&quot; &gt; &quot;Conectar com
              numero&quot; e digite o codigo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
