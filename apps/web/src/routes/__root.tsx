import { RegistryProvider } from '@effect/atom-react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '#/components/ui/sonner'
import { ThemeProvider } from '#/components/ui/theme-provider'
import { TooltipProvider } from '#/components/ui/tooltip'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-1 px-6 text-center">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-xl font-semibold tracking-tight">
        That page does not exist
      </h1>
    </div>
  ),
})

function RootComponent() {
  return (
    <RegistryProvider>
      <ThemeProvider defaultTheme="system" storageKey="timekeeper-theme">
        <TooltipProvider>
          <Outlet />
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </RegistryProvider>
  )
}
