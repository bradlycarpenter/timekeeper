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
import { createFileRoute } from '@tanstack/react-router'
import { boardSheetSchema } from '@tk/types'
import { responseParse } from '@tk/utils'

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

  return (
    <div className="p-2 space-y-2">
      <h2 className="font-semibold text-xl">Dashboard</h2>
      <div className="flex flex-wrap gap-4">
        <div className="min-w-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg space-y-2">
              Connected Boards
            </h3>
            <Button variant="link">Add Board</Button>
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
