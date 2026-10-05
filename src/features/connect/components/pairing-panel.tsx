import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import type { QrPayload } from '@/api/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

import {
  useRequestPairingCode,
  useRestartInstance,
  useStartInstance
} from '@/features/connect/mutations'
import {
  connectKeys,
  qrIsUnavailable,
  wahaQrQuery,
  wahaSessionQuery
} from '@/features/connect/queries'
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
  const start = useStartInstance(instanceId)
  const restart = useRestartInstance(instanceId)
  const session = useQuery(wahaSessionQuery(instanceId, true))
  const instances = useQuery(instancesQuery)
  const didNavigate = useRef(false)
  const [manualPhone, setManualPhone] = useState('')

  // A WAHA so emite QR e codigo com a sessao pronta para parear. Fora de
  // SCAN_QR_CODE os dois endpoints falham, entao os metodos ficam desligados
  // ate a sessao chegar la em vez de mostrar erro.
  const status = session.data?.status ?? null
  const isWorking = status === 'WORKING'
  const isStarting = status === 'STARTING'
  const canPair = status === 'SCAN_QR_CODE'
  const needsRestart = status === 'FAILED'
  const qr = useQuery(wahaQrQuery(instanceId, canPair))
  const qrUnavailable = qrIsUnavailable(qr.error)

  const storedPhone =
    instances.data?.find((instance) => instance.id === instanceId)?.phoneNumber ?? ''
  const phoneNumber = storedPhone.trim().length > 0 ? storedPhone : manualPhone
  const pairingCode = useRequestPairingCode(instanceId, phoneNumber)
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

  const handleStart = () => {
    start.mutate(undefined, {
      onSuccess: () => {
        toast.success('Sessao iniciada. Aguardando a WAHA liberar o pareamento.')
        void queryClient.invalidateQueries({ queryKey: connectKeys.session(instanceId) })
        void queryClient.invalidateQueries({ queryKey: connectKeys.qr(instanceId) })
      }
    })
  }

  const handleRestart = () => {
    restart.mutate(undefined, {
      onSuccess: () => {
        toast.success('Sessao reiniciada. Um novo QR code vai aparecer.')
      }
    })
  }

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Parear WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Escaneie o QR code no aparelho para concluir a conexao
          </p>
        </div>

        {!isWorking && !canPair && !isStarting ? (
          <Card>
            <CardHeader>
              <CardTitle>Iniciar sessao</CardTitle>
              <CardDescription>
                {needsRestart
                  ? 'A sessao caiu e precisa ser reiniciada antes de parear de novo.'
                  : 'A sessao ainda nao foi iniciada. Inicie para liberar o QR code e o codigo.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {session.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Nao foi possivel consultar a sessao. {session.error.message}
                  </AlertDescription>
                </Alert>
              ) : null}
              {needsRestart ? (
                <Button disabled={restart.isPending} onClick={handleRestart} type="button">
                  {restart.isPending ? 'Reiniciando...' : 'Reiniciar sessao'}
                </Button>
              ) : (
                <Button disabled={start.isPending} onClick={handleStart} type="button">
                  {start.isPending ? 'Iniciando...' : 'Iniciar sessao'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {isStarting ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 pt-6">
              <Skeleton className="size-52" />
              <p className="text-sm text-muted-foreground">Iniciando sessao...</p>
            </CardContent>
          </Card>
        ) : null}

        {canPair ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>QR code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                {qrUnavailable ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Alert variant="destructive">
                      <AlertDescription>
                        A sessao no WhatsApp precisa ser reiniciada para emitir um QR code novo.
                      </AlertDescription>
                    </Alert>
                    <Button
                      disabled={restart.isPending}
                      onClick={handleRestart}
                      size="sm"
                      type="button"
                    >
                      {restart.isPending ? 'Reiniciando...' : 'Reiniciar sessao'}
                    </Button>
                  </div>
                ) : qr.isError ? (
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
                <CardDescription>
                  Alternativa quando nao da para escanear o QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {storedPhone.trim().length === 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="pairing-phone">Numero do WhatsApp</Label>
                    <Input
                      autoComplete="tel"
                      id="pairing-phone"
                      inputMode="tel"
                      onChange={(event) => setManualPhone(event.target.value)}
                      placeholder="5511999999999"
                      type="tel"
                      value={manualPhone}
                    />
                  </div>
                ) : null}
                <Button
                  disabled={pairingCode.isPending || phoneNumber.trim().length === 0}
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
          </>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {status === null
              ? 'Consultando o estado da sessao...'
              : `Estado na WAHA: ${status}`}
          </p>
          <Button
            disabled={session.isFetching}
            onClick={() => void session.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Verificar status
          </Button>
        </div>
      </div>
    </div>
  )
}
