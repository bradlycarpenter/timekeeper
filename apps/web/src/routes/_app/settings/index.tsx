import { useAtomRefresh, useAtomSet, useAtomValue } from '@effect/atom-react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { AsyncResult } from 'effect/unstable/reactivity'
import { KanbanSquare, Timer } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '#/auth'
import { Connection } from '#/components/connection/connection'
import { ScreenState } from '#/components/screen-state/screen-state'
import { Button } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'
import { keys } from '#/lib/api'
import { connectionsAtom, disconnectSheetAtom } from '#/lib/atoms'
import { describe } from '#/lib/errors'

export const Route = createFileRoute('/_app/settings/')({
  component: SettingsScreen,
})

function SettingsScreen() {
  const connections = useAtomValue(connectionsAtom)
  const refresh = useAtomRefresh(connectionsAtom)
  const disconnect = useAtomSet(disconnectSheetAtom, { mode: 'promiseExit' })

  const [linking, setLinking] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Timekeeper reads from Jira and writes to your Warp timesheet.
        </p>
      </div>

      {AsyncResult.builder(connections)
        .onInitialOrWaiting(() => <ScreenState.Loading cards={2} />)
        .onError(() => (
          <ScreenState.Failed
            title="Connections could not be loaded"
            detail="Something went wrong checking your accounts."
            onRetry={refresh}
          />
        ))
        .onSuccess((state) => (
          <div className="space-y-3">
            <Connection.Root>
              <Connection.Heading
                name="Warp timesheet"
                role="Destination"
                description="Where the day's entry is filed."
                logo={<Timer className="size-5" />}
              />
              <Connection.Status
                state={state.sheet.status}
                detail={
                  state.sheet.status === 'connected'
                    ? state.sheet.email
                    : state.sheet.status === 'stale'
                      ? 'Warp stopped accepting the saved sign in.'
                      : undefined
                }
              />
              <Connection.Actions>
                {state.sheet.status === 'connected' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disconnecting}
                    onClick={() => {
                      setDisconnecting(true)
                      void disconnect({
                        reactivityKeys: [...keys.connections],
                      }).then((exit) => {
                        setDisconnecting(false)
                        if (exit._tag === 'Failure') {
                          toast.error(
                            describe(exit.cause, 'Could not disconnect.'),
                          )
                          return
                        }
                        toast.success('Warp disconnected')
                      })
                    }}
                  >
                    {disconnecting ? <Spinner /> : null}
                    Disconnect
                  </Button>
                ) : (
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/settings/warp">
                      {state.sheet.status === 'stale'
                        ? 'Sign in again'
                        : 'Connect Warp'}
                    </Link>
                  </Button>
                )}
              </Connection.Actions>
            </Connection.Root>

            <Connection.Root>
              <Connection.Heading
                name="Jira"
                role="Source"
                description="Where your tickets and their statuses are read from."
                logo={<KanbanSquare className="size-5" />}
              />
              <Connection.Status state={state.board.status} />
              <Connection.Actions>
                {state.board.status === 'connected' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void authClient
                        .unlinkAccount({ providerId: 'atlassian' })
                        .then(() => {
                          refresh()
                          toast.success('Jira disconnected')
                        })
                    }}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={linking}
                    onClick={() => {
                      setLinking(true)
                      void authClient
                        .linkSocial({
                          provider: 'atlassian',
                          callbackURL: '/settings',
                        })
                        .finally(() => setLinking(false))
                    }}
                  >
                    {linking ? <Spinner /> : null}
                    Connect Jira
                  </Button>
                )}
              </Connection.Actions>
            </Connection.Root>
          </div>
        ))
        .render()}

      <div className="mt-8 flex gap-4">
        <Link
          to="/privacy"
          className="text-muted-foreground text-xs hover:text-foreground"
        >
          Privacy policy
        </Link>
        <Link
          to="/terms"
          className="text-muted-foreground text-xs hover:text-foreground"
        >
          Terms of service
        </Link>
      </div>
    </>
  )
}
