import z from 'zod'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { WarpProject } from '@tk/types'
import { createFileRoute } from '@tanstack/react-router'
import { Spinner } from '#/components/ui/spinner'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<WarpProject[]>([])
  const [storageIsReady, setStorageIsReady] = useState(false)

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
              const newToken = await fetch('api/sheets/auth', {
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
      {error && <p className="text-red-500 font-semibold">{error}</p>}
    </div>
  )
}
