import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { RouterContext } from '@/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <TooltipProvider>
      <Outlet />
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
      Pagina nao encontrada.
    </div>
  )
})
