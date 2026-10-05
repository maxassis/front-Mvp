import type { ReactNode } from 'react'

export const AuthShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-6">
    <div className="w-full max-w-sm">{children}</div>
  </div>
)

export const AuthCard = ({
  children,
  description,
  footer,
  title
}: {
  children: ReactNode
  description: string
  footer: ReactNode
  title: string
}) => (
  <div className="rounded-xl border bg-card p-6 shadow-sm">
    <div className="mb-6 space-y-1">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {children}
    <div className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">{footer}</div>
  </div>
)
