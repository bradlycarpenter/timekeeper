import { ScrollArea } from '#/components/ui/scroll-area'
import { createFileRoute } from '@tanstack/react-router'
import type { WarpProject } from '@tk/types'
import { warpProjectSchema } from '@tk/types'
import { useEffect, useState } from 'react'
import z from 'zod'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<WarpProject[]>([])
  const [storageIsReady, setStorageIsReady] = useState(false)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (token) localStorage.setItem('token', JSON.stringify({ token }))
  }, [token])

  useEffect(() => {
    const storageToken = localStorage.getItem('token')
    if (storageToken != null) {
      const parsed = JSON.parse(storageToken)
      if (parsed?.token) setToken(parsed.token)
    }
    setStorageIsReady(true)
  }, [setToken])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      setLoading(true)
      try {
        const newProjects = await fetch(`/api/sheets/projects/${page}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then(async (res) => {
          if (!res.ok) {
            throw new Error('Error fetching projects.')
          }
          const json = await res.json()
          const parseResult = warpProjectSchema.array().safeParse(json)
          if (!parseResult.success) {
            throw new Error('Error parsing projects')
          }
          return parseResult.data
        })
        setProjects(newProjects)
      } catch (e) {
        console.log(e)
        setError('Error fetching projects')
      }
      setLoading(false)
    })()
  }, [token, setProjects, setError, page, setLoading])

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
    <div className="flex flex-1 h-screen flex-col items-center justify-center space-y-2">
      {loading && <p>Loading...</p>}
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
              }).then(async (r) => {
                if (!r.ok) {
                  throw new Error('Failed to fetch token')
                }
                const parseResult = z
                  .object({
                    token: z.string(),
                  })
                  .safeParse(await r.json())
                if (!parseResult.success) {
                  throw new Error('Failed to parse fetch result')
                }
                return parseResult.data.token
              })

              setToken(newToken)
            } catch (newError) {
              console.error(newError)
              setError('Error Fetching Auth Token')
            }
          }}
          className="flex flex-col space-y-2 items-center justify-center"
        >
          <label>Email</label>
          <input
            name="email"
            className="border rounded-md p-1 text-muted-foreground"
          />
          <label>Password</label>
          <input
            name="password"
            className="border rounded-md p-1 text-muted-foreground"
          />
          <button className="border bg bg-accent text-accent-foreground w-full rounded-md p-1">
            Accept
          </button>
        </form>
      )}
      <p>Page: {page}</p>
      <label>Table Filter on Client Name</label>
      <input
        className="border p-1 rounded-2xl"
        onChange={(e) => {
          e.preventDefault()
          setFilter(e.target.value)
        }}
      />
      {projects.length > 0 && (
        <ScrollArea className="h-72 w-2xl">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Name</th>
                <th>Client Group ID</th>
                <th>Client Name</th>
              </tr>
            </thead>
            <tbody>
              {projects
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
                  </tr>
                ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
      <div className="flex gap-2">
        <button
          className="border rounded-2xl px-2 p-1"
          onClick={() => {
            if (page < 1) return
            setPage(page - 1)
          }}
        >
          Previous Page
        </button>
        <button
          className="border rounded-2xl px-2 p-1"
          onClick={() => {
            setPage(page + 1)
          }}
        >
          Next Page
        </button>
      </div>
      {error && <p className="text-red-500 font-semibold">{error}</p>}
    </div>
  )
}
