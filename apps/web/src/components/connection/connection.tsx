import { AlertCircle, CheckCircle2, Circle } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import type {
  ConnectionActionsProps,
  ConnectionHeadingProps,
  ConnectionRootProps,
  ConnectionStatusProps,
} from './connection.types.ts'

const states = {
  connected: {
    label: 'Connected',
    icon: CheckCircle2,
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  stale: {
    label: 'Sign in again',
    icon: AlertCircle,
    className:
      'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
  disconnected: {
    label: 'Not connected',
    icon: Circle,
    className: 'bg-muted text-muted-foreground',
  },
} as const

const ConnectionRoot = (props: ConnectionRootProps) => (
  <Card className="gap-3 py-4">{props.children}</Card>
)

const ConnectionHeading = (props: ConnectionHeadingProps) => (
  <CardContent className="flex items-start gap-3 px-4">
    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
      {props.logo}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="font-semibold">{props.name}</p>
        <Badge variant="outline" className="text-[0.6875rem]">
          {props.role}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-0.5 text-sm">
        {props.description}
      </p>
    </div>
  </CardContent>
)

const ConnectionStatus = (props: ConnectionStatusProps) => {
  const state = states[props.state]
  const Icon = state.icon
  return (
    <CardContent className="px-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`gap-1 rounded-full border-0 ${state.className}`}>
          <Icon className="size-3.5" />
          {state.label}
        </Badge>
        {props.detail ? (
          <span className="text-muted-foreground truncate text-xs">
            {props.detail}
          </span>
        ) : null}
      </div>
    </CardContent>
  )
}

const ConnectionActions = (props: ConnectionActionsProps) => (
  <CardFooter className="gap-2 px-4">{props.children}</CardFooter>
)

export const Connection = {
  Root: ConnectionRoot,
  Heading: ConnectionHeading,
  Status: ConnectionStatus,
  Actions: ConnectionActions,
}
