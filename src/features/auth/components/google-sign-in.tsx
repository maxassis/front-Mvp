import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSignInWithGoogle } from '@/features/auth/mutations'

export function GoogleSignIn() {
  const google = useSignInWithGoogle()

  // O latch e o isPending somado ao isSuccess: entre o redirect interno e a
  // descarga da pagina o isPending ja volta a false, e so o isSuccess impede um
  // segundo POST com um segundo state. Em erro o TanStack limpa o isSuccess e
  // o usuario pode tentar de novo.
  const isHandingOff = google.isPending || google.isSuccess

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex-1 border-t" />
        <span className="text-xs text-muted-foreground">ou</span>
        <span className="flex-1 border-t" />
      </div>

      <Button
        disabled={isHandingOff}
        onClick={() => google.mutate()}
        type="button"
        variant="outline"
      >
        {isHandingOff ? 'Redirecionando...' : 'Entrar com Google'}
      </Button>

      {google.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{google.error.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
