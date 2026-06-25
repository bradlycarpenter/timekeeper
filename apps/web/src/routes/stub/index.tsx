import { Spinner } from '#/components/ui/spinner'
import { createFileRoute } from '@tanstack/react-router'
import { StatusCondition, stubMessages } from '@tk/types'
import { responseParseOrThrow } from '@tk/utils'
import { Fragment, useEffect, useState } from 'react'
import { z } from 'zod'

const boardSheetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sheetTaskId: z.number(),
  sheetName: z.string(),
  sheetClientName: z.string(),
  boardId: z.string(),
  boardName: z.string(),
  boardKey: z.string(),
})

type BoardSheet = z.infer<typeof boardSheetSchema>

const jiraStatus = z.object({
  self: z.string(),
  name: z.string(),
  id: z.string(),
})

type JiraStatus = z.infer<typeof jiraStatus>

const jiraStatusCategorySchema = z.object({
  self: z.string(),
  id: z.number(),
  key: z.string(),
  colorName: z.string(),
  name: z.string(),
  statuses: jiraStatus.array(),
})

type JiraStatusCategory = z.infer<typeof jiraStatusCategorySchema>

export const Route = createFileRoute('/stub/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [boardSheets, boardSheetsSet] = useState<BoardSheet[]>([])
  const [boardSheetSelected, boardSheetSelectedSet] = useState<BoardSheet>()
  const [jiraStatusSelected, jiraStatusSelectedSet] = useState<JiraStatus>()
  const [jiraStatusCategories, jiraStatusCategoriesSet] = useState<
    JiraStatusCategory[]
  >([])
  const [loading, loadingSet] = useState(false)
  const [error, errorSet] = useState('')

  useEffect(() => {
    loadingSet(true)
    fetch('/api/boardsheet')
      .then((res) =>
        responseParseOrThrow({
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
    fetch(`/api/work/status/${boardSheetSelected.boardKey}`)
      .then((res) =>
        responseParseOrThrow({
          res,
          schema: jiraStatusCategorySchema.array(),
          name: 'Jira Project Category',
        }),
      )
      .then(jiraStatusCategoriesSet)
      .catch(() => errorSet('Error fetching statuses'))
      .finally(() => loadingSet(false))
  }, [boardSheetSelected])

  if (loading)
    return (
      <div className="flex flex-1 h-screen items-center justify-center">
        <Spinner className="size-max w-md h-md" />
      </div>
    )

  return (
    <div className="flex flex-1 h-screen flex-col items-center justify-center gap-2 p-2">
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
      {jiraStatusCategories.length > 0 && (
        <div>
          <table className="w-2xl text-left">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {jiraStatusCategories.map((jsc) => (
                <Fragment key={jsc.id}>
                  <tr>
                    <td></td>
                    <td className="font-semibold">{jsc.name}</td>
                    <td></td>
                  </tr>

                  {jsc.statuses.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>
                        <input
                          type="radio"
                          name="jiraStatus"
                          onChange={() => jiraStatusSelectedSet(s)}
                          checked={jiraStatusSelected?.id === s.id}
                        />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
          <table className='w-2xl text-left'>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{StatusCondition.Entered}</td>
                <td>Entered</td>
                <td>
                  <input type="radio" name="statusCondition" />
                </td>
              </tr>
              <tr>
                <td>{StatusCondition.Stationary}</td>
                <td>Stationary</td>
                <td>
                  <input type="radio" name="statusCondition" />
                </td>
              </tr>
              <tr>
                <td>{StatusCondition.Left}</td>
                <td>Left</td>
                <td>
                  <input type="radio" name="statusCondition" />
                </td>
              </tr>
            </tbody>
          </table>
          <table className="w-2xl text-left">
            <thead>
              <tr>
                <th>ID</th>
                <th>Text</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {stubMessages.map((sm) => (
                <tr key={sm.id}>
                  <td>{sm.id}</td>
                  <td>{sm.text}</td>
                  <td>
                    <input type="radio" name="stubMessage" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
