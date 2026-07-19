import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  boardSheetSchema,
  toWarpAuthStatus,
  warpAuthStatusSchema,
  WarpAuthStatus,
} from '@tk/types'
import { responseParse } from '@tk/utils'
import warpLogo from '#/assets/warp-logo-light-3.svg'
import jiraLogo from '#/assets/jira-logo-light.svg'
import { authClient } from '#/auth'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    error: bsError,
    isPending: bsPending,
    data: bsData,
  } = useQuery({
    queryKey: ['boardSheets'],
    queryFn: async () =>
      fetch(`/api/boardsheet`).then((res) =>
        responseParse({
          res,
          schema: boardSheetSchema.array(),
          name: 'Projects',
        }),
      ),
  })

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

  return (
    <div className="p-2 space-y-2">
      <h2 className="font-semibold text-xl">Dashboard</h2>
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-xs space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg space-y-2">Connections</h3>
            <Button variant="link" className="cursor-pointer" asChild>
              <Link to='/dashboard/connections'>Edit</Link>
            </Button>
          </div>

          <div className="flex items-center justify-between p-2 border rounded-2xl">
            <div className="flex gap-2 items-center">
              <img src={warpLogo} className="size-8" />
              <div className="flex flex-col">
                <p className="text-sm">Warp Development</p>
                <p className="text-sm text-muted-foreground">Sheet</p>
              </div>
            </div>

            {saError ? (
              <Badge className="bg-red-400 dark:bg-red-700">Error</Badge>
            ) : saPending ? (
              <Skeleton className="rounded-full h-5 w-19" />
            ) : toWarpAuthStatus(saData.status) !== WarpAuthStatus.Authed ? (
              <Badge className="bg-yellow-400 dark:bg-yellow-700">
                Authenticate
              </Badge>
            ) : (
              <Badge className="bg-green-400 dark:bg-green-700">
                Connected
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-2 border rounded-2xl">
            <div className="flex gap-2 items-center">
              <img src={jiraLogo} className="size-8" />
              <div className="flex flex-col">
                <p className="text-sm">Jira</p>
                <p className="text-sm text-muted-foreground">Board</p>
              </div>
            </div>
            {accError ? (
              <Badge className="bg-red-400 dark:bg-red-700">Error</Badge>
            ) : accPending ? (
              <Skeleton className="rounded-full h-5 w-19" />
            ) : !accData.some((a) => a.providerId === 'atlassian') ? (
              <Badge className="bg-yellow-400 dark:bg-yellow-700">
                Authenticate
              </Badge>
            ) : (
              <Badge className="bg-green-400 dark:bg-green-700">
                Connected
              </Badge>
            )}
          </div>
        </div>
        <div className="w-full sm:w-xs space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg space-y-2">
              Connected Boards
            </h3>
            <Button variant="link" className="cursor-pointer">
              Add Board
            </Button>
          </div>
          {bsError ? (
            <p>We had trouble loading your connected boards</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Board Name</TableHead>
                  <TableHead>Sheet Customer</TableHead>
                  <TableHead>Sheet Project</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bsPending ? (
                  <TableRow>
                    <TableCell>
                      <Skeleton className="w-20 h-4 rounded-none" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-26 h-4 rounded-none" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-22 h-4 rounded-none" />
                    </TableCell>
                  </TableRow>
                ) : (
                  bsData.map((bs) => (
                    <TableRow key={bs.id}>
                      <TableCell>{bs.boardName}</TableCell>
                      <TableCell>{bs.sheetClientName}</TableCell>
                      <TableCell>{bs.sheetName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
