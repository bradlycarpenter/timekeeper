import { useAtomValue } from '@effect/atom-react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AsyncResult } from 'effect/unstable/reactivity'
import { CalendarCheck, Link2, Settings } from 'lucide-react'
import { AppShell } from '#/components/app-shell/app-shell'
import { authClient } from '#/auth'
import { viewerAtom } from '#/lib/atoms'

/** Every screen behind this route needs a session, so the check happens once
 * here rather than in each screen. */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const { data } = await authClient.getSession()
    if (!data?.user) {
      throw redirect({ to: '/login', search: { next: location.href } })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const viewer = useAtomValue(viewerAtom)

  return (
    <AppShell.Root>
      <AppShell.Nav>
        <AppShell.NavItem
          to="/today"
          label="Today"
          icon={<CalendarCheck className="size-5" />}
        />
        <AppShell.NavItem
          to="/links"
          label="Links"
          icon={<Link2 className="size-5" />}
        />
        <AppShell.NavItem
          to="/settings"
          label="Settings"
          icon={<Settings className="size-5" />}
        />
      </AppShell.Nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppShell.Header>
          {AsyncResult.builder(viewer)
            .onSuccess((user) => (
              <AppShell.Account
                name={user.name}
                email={user.email}
                image={user.image}
                onSignOut={() => {
                  void authClient.signOut().then(() => {
                    window.location.href = '/login'
                  })
                }}
              />
            ))
            .render()}
        </AppShell.Header>
        <AppShell.Content>
          <Outlet />
        </AppShell.Content>
      </div>
    </AppShell.Root>
  )
}
