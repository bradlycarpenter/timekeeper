import { useAtomSet } from '@effect/atom-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Spinner } from '#/components/ui/spinner'
import { keys } from '#/lib/api'
import { connectSheetAtom, connectionsAtom } from '#/lib/atoms'
import { describe } from '#/lib/errors'
import { registry } from '#/lib/registry'

export const Route = createFileRoute('/_app/settings/warp')({
  loader: () => {
    registry.get(connectionsAtom)
  },
  component: ConnectWarpScreen,
})

function ConnectWarpScreen() {
  const navigate = useNavigate()
  const connect = useAtomSet(connectSheetAtom, { mode: 'promiseExit' })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [problem, setProblem] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!email.includes('@') || password.length === 0) {
      setProblem('Enter the email and password you use for Warp.')
      return
    }

    setProblem(undefined)
    setBusy(true)
    const exit = await connect({
      payload: { email, password },
      reactivityKeys: [...keys.connections],
    })
    setBusy(false)

    if (exit._tag === 'Failure') {
      setProblem(describe(exit.cause, 'Warp would not accept that sign in.'))
      return
    }

    toast.success('Warp connected')
    void navigate({ to: '/settings' })
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Connect Warp</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Sign in with your Warp account so Timekeeper can file entries as you.
      </p>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FieldGroup>
          <Field data-invalid={problem !== undefined}>
            <FieldLabel htmlFor="warp-email">Email</FieldLabel>
            <Input
              id="warp-email"
              type="email"
              autoComplete="username"
              placeholder="name@warpdevelopment.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field data-invalid={problem !== undefined}>
            <FieldLabel htmlFor="warp-password">Password</FieldLabel>
            <Input
              id="warp-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {problem ? <FieldError errors={[{ message: problem }]} /> : null}
          </Field>
          <Field>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner /> : null}
              Connect
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <Alert className="mt-6">
        <Info className="size-4" />
        <AlertDescription>
          Warp only issues a token in exchange for a password, so it is sent once
          and only the token it returns is stored.
        </AlertDescription>
      </Alert>
    </div>
  )
}
