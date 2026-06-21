import { authClient } from '#/auth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          await authClient.signIn.social({
            provider: 'microsoft',
            callbackURL: '/',
          })
        }}
      >
        Sign in with Microsoft
      </button>
      <button
        type="button"
        onClick={async () =>
          await authClient.linkSocial({
            provider: 'atlassian',
            callbackURL: '/settings',
          })
        }
      >
        Link Attlassian
      </button>
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut({})
        }}
      >
        Logout
      </button>
    </>
  )
}
