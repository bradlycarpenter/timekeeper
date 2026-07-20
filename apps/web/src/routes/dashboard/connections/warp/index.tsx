import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useForm } from '@tanstack/react-form'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { responseParse } from '@tk/utils'
import { Spinner } from '#/components/ui/spinner'

export const Route = createFileRoute('/dashboard/connections/warp/')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isPending, isError, mutate } = useMutation({
    mutationFn: async (value: { email: string; password: string }) =>
      fetch('/api/sheets/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      }).then(async (res) =>
        responseParse({
          res,
          schema: z.object({
            success: z.boolean(),
          }),
          name: 'Warp Auth Result',
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sheetAuth'] })
      navigate({ to: '..' })
    },
  })

  const form = useForm({
    validators: {
      onSubmit: z.object({
        email: z.email({ message: 'You must provide a valid email address' }),
        password: z.string().min(1, { message: 'You must provide a password' }),
      }),
    },
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: ({ value }) => {
      mutate(value)
    },
  })

  return (
    <div className="p-2 space-y-2">
      <div className="flex gap-1">
        <Link to="/dashboard">
          <h2 className="text-xl text-muted-foreground">Dashboard</h2>
        </Link>
        <h2 className="text-xl text-accent">/</h2>
        <Link to="/dashboard/connections">
          <h2 className="text-xl text-muted-foreground">Connections</h2>
        </Link>
        <h2 className="text-xl text-accent">/</h2>
        <h2 className="font-semibold text-xl">Warp</h2>
      </div>
      <div className={cn('flex flex-col gap-6 max-w-sm')}>
        <Card>
          <CardHeader>
            <CardTitle>Login to your Warp Account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="login-form"
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              <FieldGroup>
                <form.Field
                  name="email"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="name@warpdevelopment.com"
                          autoComplete="off"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="password"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Your password"
                          type="password"
                          autoComplete="off"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
                <Field>
                  <Button
                    type="submit"
                    variant={isPending ? 'secondary' : 'default'}
                    disabled={isPending || isError}
                    className={cn(isError && 'bg-red-500')}
                  >
                    {isPending ? (
                      <>
                        <Spinner /> Loading
                      </>
                    ) : isError ? (
                      'We had an issue'
                    ) : (
                      'Log in'
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
