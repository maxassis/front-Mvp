import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateInstance, useStartInstance } from '@/features/connect/mutations'
import { useUiStore } from '@/stores/ui-store'

interface ConnectFormProps {
  onPaired: (instanceId: string) => void
}

export function ConnectForm({ onPaired }: ConnectFormProps) {
  const selectInstance = useUiStore((state) => state.selectInstance)
  const create = useCreateInstance()
  const [instanceName, setInstanceName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      { instanceName, phoneNumber: phoneNumber.trim() },
      {
        onSuccess: (instance) => {
          selectInstance(instance.id)
          setCreatedId(instance.id)
        }
      }
    )
  }

  if (createdId !== null) {
    return <StartSession instanceId={createdId} onPaired={onPaired} />
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Conectar WhatsApp</CardTitle>
          <CardDescription>Crie a instancia para comecar a receber mensagens</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="connect-instance-name">Nome da instancia</Label>
              <Input
                autoComplete="off"
                id="connect-instance-name"
                onChange={(event) => setInstanceName(event.target.value)}
                placeholder="Opcional"
                value={instanceName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="connect-phone">Numero do WhatsApp</Label>
              <Input
                autoComplete="tel"
                id="connect-phone"
                inputMode="tel"
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="5511999999999"
                required
                type="tel"
                value={phoneNumber}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Provedor</p>
              <Badge variant="outline">WAHA</Badge>
            </div>

            <Button className="w-full" disabled={create.isPending} type="submit">
              {create.isPending ? 'Criando instancia...' : 'Criar e conectar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

interface StartSessionProps {
  instanceId: string
  onPaired: (instanceId: string) => void
}

function StartSession({ instanceId, onPaired }: StartSessionProps) {
  const start = useStartInstance(instanceId)
  const didStart = useRef(false)

  const handlePaired = useCallback(() => onPaired(instanceId), [instanceId, onPaired])

  const handleStart = useCallback(() => {
    start.mutate(undefined, { onSuccess: handlePaired })
  }, [handlePaired, start])

  useEffect(() => {
    if (didStart.current) {
      return
    }
    // O StrictMode roda o efeito duas vezes em dev; a referencia evita start duplicado.
    didStart.current = true
    handleStart()
  }, [handleStart])

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciando sessao</CardTitle>
          <CardDescription>Abrindo a conexao com o WhatsApp...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          {start.isError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                {start.error instanceof Error ? start.error.message : 'Falha ao iniciar a sessao'}
              </p>
              <Button onClick={handleStart} type="button" variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
