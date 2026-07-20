import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '#/components/ui/spinner'
import { cn } from '#/lib/utils'
import { authClient } from '#/auth'
import {
  toWarpAuthStatus,
  WarpAuthStatus,
  warpAuthStatusSchema,
} from '@tk/types'
import { responseParse } from '@tk/utils'

export const Route = createFileRoute('/dashboard/connections/')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    error: saError,
    isPending: saPending,
    data: saData,
  } = useQuery({
    queryKey: ['sheetAuth'],
    queryFn: async () =>
      fetch('/api/sheets/auth').then((res) =>
        responseParse({
          res,
          schema: warpAuthStatusSchema,
          name: 'Sheet Auth',
        }),
      ),
  })

  const {
    error: accError,
    isPending: accPending,
    data: accData,
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await authClient.listAccounts()).data ?? [],
  })

  console.log(saPending)

  return (
    <div className="p-2 space-y-2">
      <div className="flex gap-1">
        <Link to="/dashboard">
          <h2 className="text-xl text-muted-foreground">Dashboard</h2>
        </Link>
        <h2 className="text-xl text-accent">/</h2>
        <h2 className="font-semibold text-xl">Connections</h2>
      </div>

      <div className="flex gap-4">
        <Card className="relative min-w-xs max-w-md pt-0">
          <div className="absolute inset-0 z-30 aspect-video" />
          <img
            src="https://www.warpdevelopment.com/wp-content/uploads/2023/10/warp-logo-light-3.svg"
            alt="Event cover"
            className="relative z-20 aspect-video w-full object-contain bg-black p-4"
          />
          <CardHeader>
            <CardTitle>Warp Development</CardTitle>
            <CardDescription className="h-10">
              Destination for timesheet entries.
            </CardDescription>
            <CardAction>Sheet</CardAction>
          </CardHeader>
          <CardFooter>
            <Button
              className={cn(
                'w-full',
                saError && 'bg-red-500',
                (saError ||
                  saPending ||
                  toWarpAuthStatus(saData.status) === WarpAuthStatus.Authed) &&
                  'pointer-events-none opacity-50',
                !saPending &&
                  !saError &&
                  (toWarpAuthStatus(saData.status) !== WarpAuthStatus.Authed
                    ? 'bg-yellow-700'
                    : 'bg-green-500'),
              )}
              variant={!saPending ? 'default' : 'secondary'}
              asChild
            >
              <Link
                to="/dashboard/connections/warp"
                disabled={
                  saPending ||
                  !!saError ||
                  toWarpAuthStatus(saData.status) === WarpAuthStatus.Authed
                }
              >
                {saPending && <Spinner />}
                {saPending
                  ? 'Loading'
                  : saError
                    ? 'Something went wrong'
                    : toWarpAuthStatus(saData.status) !== WarpAuthStatus.Authed
                      ? 'Connect'
                      : 'Connected'}
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="relative max-w-xs pt-0">
          <div className="absolute inset-0 z-30 aspect-video" />
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Jira_Logo.svg/1280px-Jira_Logo.svg.png"
            alt="Event cover"
            className="relative z-20 aspect-video w-full object-contain bg-white p-4"
          />
          <CardHeader>
            <CardTitle>Jira</CardTitle>
            <CardAction>Board</CardAction>
            <CardDescription className="h-10">
              Source of truth for work done for projects that use Jira.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              disabled={
                accPending ||
                !!accError ||
                accData.some((a) => a.providerId === 'atlassian')
              }
              className={cn(
                'w-full',
                !!accError && 'bg-red-500',
                !accError &&
                  !accPending &&
                  (!accData?.some((a) => a.providerId === 'atlassian')
                    ? 'bg-yellow-700'
                    : 'bg-green-500'),
              )}
              onClick={async () =>
                await authClient.linkSocial({
                  provider: 'atlassian',
                  callbackURL: '/dev/boardsheet/',
                })
              }
              variant={!saPending ? 'default' : 'secondary'}
            >
              {accPending && <Spinner />}
              {accPending
                ? 'Loading'
                : accError
                  ? 'Something went wrong'
                  : !accData.some((a) => a.providerId === 'atlassian')
                    ? 'Connect'
                    : 'Connected'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
