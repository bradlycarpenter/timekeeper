import { createFileRoute, redirect } from '@tanstack/react-router'
import { Schema } from 'effect'
import { TimerIcon } from 'lucide-react'
import { useState } from 'react'
import { authClient, readSession } from '#/auth'
import { Button } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'

const SearchParams = Schema.Struct({
  next: Schema.optional(Schema.String),
})

/** Shares the same session cache as `_app` and `/`, so landing on `/login`
 * with a still-valid session (e.g. the back button) redirects without
 * another round trip to better-auth. */
export const Route = createFileRoute('/login/')({
  validateSearch: Schema.decodeUnknownSync(SearchParams),
  beforeLoad: async () => {
    const user = await readSession()
    if (user) {
      throw redirect({ to: '/today' })
    }
  },
  component: LoginScreen,
})

function LoginScreen() {
  const { next } = Route.useSearch()
  const [signingIn, setSigningIn] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-center gap-2">
          <TimerIcon className="text-primary size-9" />
          <span className="text-3xl font-semibold tracking-tight">
            Time<span className="text-primary">keeper</span>
          </span>
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Your timesheet, written for you
        </h1>
        <p className="text-muted-foreground mt-2 text-[0.9375rem] leading-relaxed">
          Timekeeper reads what you moved on your Jira board and files the day's
          entry on your Warp timesheet before you leave.
        </p>

        <Button
          size="lg"
          className="mt-8 w-full"
          disabled={signingIn}
          onClick={() => {
            setSigningIn(true)
            void authClient
              .signIn
              .social({
                provider: 'microsoft',
                callbackURL: next ?? '/today',
              })
              .finally(() => setSigningIn(false))
          }}
        >
          {signingIn ? <Spinner /> : null}
          Continue with Microsoft
        </Button>

        <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
          You will connect Jira and your Warp timesheet after signing in.
        </p>
      </div>
    </div>
  )
}
