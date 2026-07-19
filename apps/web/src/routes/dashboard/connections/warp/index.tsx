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
import { createFileRoute, Link } from '@tanstack/react-router'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import z from 'zod'

export const Route = createFileRoute('/dashboard/connections/warp/')({
  component: RouteComponent,
})

function RouteComponent() {
  const form = useForm({
    validators: {
      onSubmit: z.object({
        email: z.email({ message: 'You must provide an email address' }),
        password: z
          .string()
          .min(1, { message: 'You must indicate a password' }),
      }),
    },
    onSubmit: async ({ value }) => {
      console.log(value)
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
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@warpdevelopment.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input id="password" type="password" required />
                </Field>
                <Field>
                  <Button type="submit">Login</Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
