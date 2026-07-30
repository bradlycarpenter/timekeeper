import { createFileRoute, redirect } from '@tanstack/react-router'
import { authClient } from '#/auth'

/** The app has no marketing page: signed in goes to today's entry, signed out
 * goes to sign in. */
export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()
    throw redirect({ to: data?.user ? '/today' : '/login' })
  },
})
