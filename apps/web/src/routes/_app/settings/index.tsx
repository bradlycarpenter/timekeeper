import { useAtomRefresh, useAtomSet, useAtomValue } from '@effect/atom-react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { AsyncResult } from 'effect/unstable/reactivity'
import { KanbanSquare, Timer } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '#/auth'
import { Connection } from '#/components/connection/connection'
import { PageHeader } from '#/components/page-header/page-header'
import { PageLayout } from '#/components/page-layout/page-layout'
import { ScreenState } from '#/components/screen-state/screen-state'
import { Button } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'
import { keys } from '#/lib/api'
import { TermsFields } from '#/components/terms-fields/terms-fields'
import {
  connectionsAtom,
  disconnectSheetAtom,
  settingsAtom,
  updateSettingsAtom,
} from '#/lib/atoms'
import { describe } from '#/lib/errors'
import { registry } from '#/lib/registry'

export const Route = createFileRoute('/_app/settings/')({
  loader: () => {
    registry.get(connectionsAtom)
  },
  component: SettingsScreen,
})

function SettingsScreen() {
  const connections = useAtomValue(connectionsAtom)
  const refresh = useAtomRefresh(connectionsAtom)
  const disconnect = useAtomSet(disconnectSheetAtom, { mode: 'promiseExit' })

  const [linking, setLinking] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const settings = useAtomValue(settingsAtom)
  const refreshSettings = useAtomRefresh(settingsAtom)
  const updateSettings = useAtomSet(updateSettingsAtom, {
    mode: 'promiseExit',
  })

  /* Held locally so the buttons respond on tap rather than after the round
   * trip; the saved value takes over again once it lands. */
  const [standardHours, setStandardHours] = useState<number>()

  const saveStandardHours = async (hours: number) => {
    const exit = await updateSettings({
      payload: { standardHours: hours },
      reactivityKeys: [...keys.settings, ...keys.today],
    })

    if (exit._tag !== 'Success') {
      setStandardHours(undefined)
      toast.error(describe(exit.cause, 'That could not be saved.'))
    }
  }

  return (
    <PageLayout.Root>
      <PageHeader.Root>
        <PageHeader.Title
          heading="Settings"
          description="Timekeeper reads from Jira and writes to your Warp timesheet."
        />
      </PageHeader.Root>

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
          <div className="space-y-6">
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
                    className="h-11 md:h-8"
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
                  <Button asChild className="h-11 flex-1 md:h-8">
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
                    className="h-11 md:h-8"
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
                    className="h-11 flex-1 md:h-8"
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

      <ScreenState.Section
        title="Your working day"
        description="The day Timekeeper expects you to fill. Anything you bill beyond it belongs on an overtime entry."
      >
        {AsyncResult.builder(settings)
          .onInitialOrWaiting(() => <ScreenState.Loading cards={1} />)
          .onError(() => (
            <ScreenState.Failed
              title="Settings could not be loaded"
              detail="Something went wrong reading your working day."
              onRetry={refreshSettings}
            />
          ))
          .onSuccess((saved) => (
            <TermsFields.Hours
              value={standardHours ?? saved.standardHours}
              onChange={(hours) => {
                setStandardHours(hours)
                void saveStandardHours(hours)
              }}
              hint="Used for the day total on Today."
            />
          ))
          .render()}
      </ScreenState.Section>

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
    </PageLayout.Root>
  )
}
