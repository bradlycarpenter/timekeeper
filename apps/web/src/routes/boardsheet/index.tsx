import { ScrollArea } from '#/components/ui/scroll-area'
import { createFileRoute } from '@tanstack/react-router'
import type { WarpProject, JiraProject } from '@tk/types'
import { jiraProjectSchema, warpProjectSchema } from '@tk/types'
import { responseParseOrThrow } from '@tk/utils'
import { useEffect, useState } from 'react'
import { z } from 'zod'

export const Route = createFileRoute('/boardsheet/')({ component: BoardSheet })

function BoardSheet() {
  const [token, tokenSet] = useState('')
  const [error, errorSet] = useState('')
  const [loading, loadingSet] = useState(false)
  const [warpProjects, warpProjectsSet] = useState<WarpProject[]>([])
  const [jiraProjects, jiraProjectsSet] = useState<JiraProject[]>([])
  const [warpProjectSelected, warpProjectSelectedSet] = useState<
    WarpProject | undefined
  >()
  const [jiraProjectSelected, jiraProjectSelectedSet] = useState<
    JiraProject | undefined
  >()
  const [storageIsReady, storageSetIsReady] = useState(false)
  const [page, pageSet] = useState(1)
  const [filter, filterSet] = useState('')

  useEffect(() => {
    if (token) localStorage.setItem('token', JSON.stringify({ token }))
  }, [token])

  useEffect(() => {
    const storageToken = localStorage.getItem('token')
    if (storageToken != null) {
      const parsed = JSON.parse(storageToken)
      if (parsed?.token) tokenSet(parsed.token)
    }
    storageSetIsReady(true)
  }, [tokenSet])

  useEffect(() => {
    if (!token) return
    loadingSet(true)
    fetch(`/api/sheets/projects/${page}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) =>
        responseParseOrThrow({
          res,
          schema: warpProjectSchema.array(),
          name: 'Projects',
        }),
      )
      .then(warpProjectsSet)
      .catch(() => errorSet('Error fetching projects'))
      .finally(() => loadingSet(false))
  }, [token, warpProjectsSet, errorSet, page, loadingSet])

  if (!storageIsReady) {
    return (
      <div className="flex flex-1 h-screen flex-col items-center justify-center space-y-2">
        <div className="flex gap-2 justify-center items-center">
          <p>Local Storage Loading..</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 h-screen flex-col items-center justify-center gap-2 p-2">
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 font-semibold">{error}</p>}
      {token !== '' ? (
        <div className="flex gap-2 px-4 p-1 justify-center items-center ">
          <p>Token Set</p>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.target)
            const email = formData.get('email')
            const password = formData.get('password')
            try {
              const newToken = await fetch('/api/sheets/auth', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email,
                  password,
                }),
              }).then(async (res) =>
                responseParseOrThrow({
                  res,
                  schema: z.object({
                    token: z.string(),
                  }),
                  name: 'Auth Token',
                }),
              )
              tokenSet(newToken.token)
            } catch (newError) {
              console.error(newError)
              errorSet('Error Fetching Auth Token')
            }
          }}
          className="flex flex-col space-y-2 items-center justify-center"
        >
          <label>Email</label>
          <input name="email" className="border p-1 text-muted-foreground" />
          <label>Password</label>
          <input name="password" className="border p-1 text-muted-foreground" />
          <button className="border bg bg-accent text-accent-foreground w-full p-1">
            Accept
          </button>
        </form>
      )}
      <p>Page: {page}</p>
      <label>Table Filter on Client Name</label>
      <input
        className="border p-1 "
        onChange={(e) => {
          e.preventDefault()
          filterSet(e.target.value)
        }}
      />
      {warpProjects.length > 0 && (
        <ScrollArea className="h-72 w-2xl">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Name</th>
                <th>Client Group ID</th>
                <th>Client Name</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {warpProjects
                .filter((project) => {
                  if (filter === '') {
                    return project
                  } else if (
                    project.Client.Name.toLowerCase().includes(
                      filter.toLowerCase(),
                    )
                  ) {
                    return project
                  }
                })
                .map((project) => (
                  <tr key={project.TaskId}>
                    <td>{project.TaskId}</td>
                    <td>{project.Name}</td>
                    <td>{project.Client.GroupId}</td>
                    <td>{project.Client.Name}</td>
                    <td>
                      <input
                        type="radio"
                        name="warpProject"
                        checked={warpProjectSelected?.TaskId === project.TaskId}
                        onChange={() => warpProjectSelectedSet(project)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
      <div className="flex gap-2">
        <button
          className="border px-2 p-1"
          onClick={() => {
            if (page < 1) return
            pageSet(page - 1)
          }}
        >
          Previous Page
        </button>
        <button
          className="border px-2 p-1"
          onClick={() => {
            pageSet(page + 1)
          }}
        >
          Next Page
        </button>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            const newJiraProjects = await fetch(
              '/api/work/atlassian/projects',
            ).then((res) =>
              responseParseOrThrow({
                res,
                schema: jiraProjectSchema.array(),
                name: 'Atlassian Projects',
              }),
            )
            jiraProjectsSet(newJiraProjects)
          } catch (e) {
            console.error(e)
            errorSet('Error fetching Atlassian Projects')
          }
        }}
      >
        Fetch Atlassian Projects
      </button>
      {jiraProjects.length > 0 && (
        <table className="w-2xl text-left">
          <thead>
            <tr>
              <th>ID</th>
              <th>Key</th>
              <th>Name</th>
              <th>Select</th>
            </tr>
          </thead>
          <tbody>
            {jiraProjects.map((project) => (
              <tr key={project.id}>
                <td>{project.id}</td>
                <td>{project.key}</td>
                <td>{project.name}</td>
                <td>
                  <input
                    type="radio"
                    name="jiraProject"
                    checked={jiraProjectSelected?.id === project.id}
                    onChange={() => jiraProjectSelectedSet(project)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {jiraProjectSelected && warpProjectSelected && (
        <div className="flex flex-col gap-2 w-2xl">
          <span>Selected</span>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Client Name</th>
                <th>Key</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{warpProjectSelected.TaskId}</td>
                <td>{warpProjectSelected.Name}</td>
                <td>{warpProjectSelected.Client.Name}</td>
                <td></td>
              </tr>
              <tr>
                <td>{jiraProjectSelected.id}</td>
                <td>{jiraProjectSelected.name}</td>
                <td></td>
                <td>{jiraProjectSelected.key}</td>
              </tr>
            </tbody>
          </table>
          <button
            onClick={async () => {
              try {
                await fetch('/api/boardsheet', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    warpProject: warpProjectSelected,
                    jiraProject: jiraProjectSelected,
                  }),
                }).then((res) => {
                  if (!res.ok) {
                    throw new Error("Error posting board sheet'")
                  }
                })
              } catch (e) {
                console.error(e)
                errorSet('Error posting board sheet')
              }
            }}
            className="border px-2 p-1"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
