import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import type { QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from '#/components/ui/theme-provider'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex flex-1 h-screen flex-col items-center justify-center">
      <h2>404 Not Found</h2>
    </div>
  ),
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Outlet />
      </ThemeProvider>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </QueryClientProvider>
  )
}
