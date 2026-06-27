import { Spinner } from '#/components/ui/spinner'
import { createFileRoute } from '@tanstack/react-router'
import type { BoardSheet } from '@tk/types'
import { boardSheetSchema } from '@tk/types'
import { responseParse } from '@tk/utils'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/dev/message/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [boardSheets, boardSheetsSet] = useState<BoardSheet[]>([])
  const [boardSheetSelected, boardSheetSelectedSet] = useState<BoardSheet>()
  const [loading, loadingSet] = useState(false)
  const [error, errorSet] = useState('')

  useEffect(() => {
    loadingSet(true)
    fetch('/api/boardsheet')
      .then((res) =>
        responseParse({
          res,
          schema: boardSheetSchema.array(),
          name: 'Boardsheets',
        }),
      )
      .then(boardSheetsSet)
      .catch(() => errorSet('Error fetching board sheets'))
      .finally(() => loadingSet(false))
  }, [loadingSet, boardSheetsSet, errorSet])

  useEffect(() => {
    if (!boardSheetSelected) return
    loadingSet(true)
    fetch(`/api/messages/${boardSheetSelected.id}`)
      .then(async (res) => res.json())
      .then(console.log)
      .catch(() => errorSet('Error fetching board sheets'))
      .finally(() => loadingSet(false))
  }, [boardSheetSelected])

  if (loading)
    return (
      <div className="flex flex-1 h-screen items-center justify-center">
        <Spinner className="size-max w-md h-md" />
      </div>
    )

  return (
    <div className="flex flex-1 min-h-screen flex-col items-center justify-start gap-2 p-2">
      {error && <p>{error}</p>}
      <p>Board Sheets</p>
      {boardSheets.length < 1 ? (
        <p>No boards configured</p>
      ) : (
        <table className="w-2xl text-left">
          <thead>
            <tr>
              <th>Sheet Name</th>
              <th>Sheet Client Name</th>
              <th>Board Name</th>
              <th>Board Key</th>
              <th>Select</th>
            </tr>
          </thead>
          <tbody>
            {boardSheets.map((bs) => (
              <tr key={bs.id}>
                <td>{bs.sheetName}</td>
                <td>{bs.sheetClientName}</td>
                <td>{bs.boardName}</td>
                <td>{bs.boardKey}</td>
                <td>
                  <input
                    type="radio"
                    name="boardSheets"
                    onChange={() => boardSheetSelectedSet(bs)}
                    checked={boardSheetSelected?.id === bs.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
