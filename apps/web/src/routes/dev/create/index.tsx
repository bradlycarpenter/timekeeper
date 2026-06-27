import { createFileRoute } from '@tanstack/react-router'
import type { JiraIssue } from '@tk/types'
import {
  boardSheetSchema,
  jiraIssueSchema,
  StatusCondition
} from '@tk/types'
import { responseParse } from '@tk/utils'
import { useState } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { z } from 'zod'

export const Route = createFileRoute('/dev/create/')({
  component: RouteComponent,
  loader: async () =>
    await fetch('/api/stub').then((res) =>
      responseParse({
        res,
        schema: boardSheetSchema
          .extend({
            stubs: z
              .object({
                id: z.string(),
                boardSheetId: z.string(),
                statusId: z.number(),
                statusCondition: z.enum(StatusCondition),
                messageId: z.union([
                  z.literal(0),
                  z.literal(1),
                  z.literal(2),
                  z.literal(3),
                ]),
              })
              .array(),
          })
          .array(),
        name: 'Stubs',
      }),
    ),
})

function RouteComponent() {
  const boardSheetsStubs = Route.useLoaderData()
  const [stubSelected, stubSelectedSet] = useState<string>()
  const [jiraIssues, jiraIssuesSet] = useState<JiraIssue[]>()
  const [error, errorSet] = useState('')

  return (
    <div className="flex flex-1 min-h-screen flex-col items-center justify-start gap-2 p-2">
      {error && <p>{error}</p>}
      {boardSheetsStubs.length > 0 &&
        boardSheetsStubs.map((bss) => (
          <Fragment key={bss.id}>
            <div className="flex flex-row gap-2">
              <p>Sheet Name: {bss.sheetName}</p>
              <p>Sheet Cleint Name: {bss.sheetClientName}</p>
              <p>Board Name: {bss.boardName}</p>
              <p>Board Key: {bss.boardKey}</p>
            </div>
            {bss.stubs.length > 0 &&
              bss.stubs.map((s) => (
                <Fragment key={s.id}>
                  <table className="w-2xl text-left">
                    <thead>
                      <tr>
                        <th>Sheet ID</th>
                        <th>Status ID</th>
                        <th>Condition</th>
                        <th>Message</th>
                        <th>Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{s.boardSheetId}</td>
                        <td>{s.statusId}</td>
                        <td>{s.statusCondition}</td>
                        <td>{s.messageId}</td>
                        <td>
                          <input
                            type="radio"
                            name="stub"
                            checked={s.id === stubSelected}
                            onChange={() => stubSelectedSet(s.id)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Fragment>
              ))}
            {bss.stubs.length > 0 && (
              <button
                className="border px-2 p-1 w-full"
                onClick={async () => {
                  if (!stubSelected) {
                    errorSet('You must select a stub')
                    return
                  }
                  try {
                    await fetch(
                      `/api/work/atlassian/issues/${encodeURIComponent(stubSelected)}`,
                    )
                      .then((res) =>
                        responseParse({
                          res,
                          schema: jiraIssueSchema.array(),
                          name: 'Issues',
                        }),
                      )
                      .then(jiraIssuesSet)
                  } catch (e) {
                    console.error(e)
                    errorSet('Fetching issues failed')
                  }
                }}
              >
                Fetch Issues
              </button>
            )}
            {jiraIssues &&
              jiraIssues.map((i) => (
                <table className="w-2xl text-left" key={i.id}>
                  <thead>
                    <tr>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{i.fields.summary}</td>
                    </tr>
                  </tbody>
                </table>
              ))}
          </Fragment>
        ))}
    </div>
  )
}
