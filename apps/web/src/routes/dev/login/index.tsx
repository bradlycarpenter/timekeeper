import { authClient } from '#/auth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dev/login/')({
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
            callbackURL: '/dev/boardsheet/',
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
            callbackURL: '/dev/boardsheet/',
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
