import { authClient } from '#/auth'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { TimerIcon, User } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()
    if (!session?.user) {
      throw redirect({
        to: '/dev/login',
      })
    }
    return session
  },
  loader: ({ context }) => ({ user: context.user, session: context.session }),
})

function RouteComponent() {
  const { user } = Route.useLoaderData()

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b p-2 flex justify-between shadow-2xs">
        <div className="flex gap-1 items-center">
          <TimerIcon size={40} className="text-primary" />
          <div>
            <span className="font-semibold text-4xl">Time</span>
            <span className="font-semibold text-4xl text-primary">keeper</span>
          </div>
        </div>
        <div className="flex gap-1 items-center">
          {/* TODO: Render Actual Profile Picture */}
          <User size={40} />
          <div className="sm:flex flex-col hidden">
            <span>{user.name}</span>
            <span className="text-muted-foreground text-sm">{user.email}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-2">
        <Outlet />
      </main>
    </div>
  )
}
