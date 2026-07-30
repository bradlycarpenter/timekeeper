import { createFileRoute, redirect } from '@tanstack/react-router'
import { readSession } from '#/auth'

/** The app has no marketing page: signed in goes to today's entry, signed out
 * goes to sign in. Shares the same session cache as `_app`'s guard, so this
 * redirect is also cache-warm after the first load. */
export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await readSession()
    throw redirect({ to: user ? '/today' : '/login' })
  },
})
