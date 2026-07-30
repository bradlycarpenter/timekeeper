import { AlertTriangle, Check } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '#/components/ui/card'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import type {
  TodayEntryActionProps,
  TodayEntryActionsProps,
  TodayEntryBreakdownProps,
  TodayEntryEditorProps,
  TodayEntryHeadingProps,
  TodayEntryMessageProps,
  TodayEntryProblemProps,
  TodayEntryRootProps,
  TodayEntryStatusProps,
} from './today-entry.types.ts'

const statusStyles = {
  posted: {
    label: 'Posted',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  skipped: {
    label: 'Skipped',
    className: 'bg-muted text-muted-foreground',
  },
  failed: {
    label: 'Failed',
    className: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  },
  queued: {
    label: 'Sending',
    className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
  pending: {
    label: 'Scheduled',
    className: 'bg-primary/10 text-primary',
  },
} as const

const TodayEntryRoot = (props: TodayEntryRootProps) => (
  <Card
    className={cn(
      'gap-3 py-4 transition-opacity',
      props.status === 'skipped' && 'opacity-60',
    )}
  >
    {props.children}
  </Card>
)

const TodayEntryHeading = (props: TodayEntryHeadingProps) => (
  <CardHeader className="gap-0 px-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{props.clientName}</p>
        <p className="text-muted-foreground truncate text-sm">
          {props.projectName}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Badge variant="outline" className="font-mono text-[0.6875rem]">
          {props.boardKey}
        </Badge>
        <Badge variant="secondary" className="tabular-nums">
          {props.hours}h
        </Badge>
      </div>
    </div>
  </CardHeader>
)

const TodayEntryStatus = (props: TodayEntryStatusProps) => {
  const style = statusStyles[props.status]
  return (
    <Badge className={cn('rounded-full border-0', style.className)}>
      {style.label}
    </Badge>
  )
}

/** The text exactly as it will reach the timesheet, so there is no gap between
 * what is shown and what gets posted. */
const TodayEntryMessage = (props: TodayEntryMessageProps) =>
  props.message.length > 0 ? (
    <CardContent className="px-4">
      <p className="text-[0.9375rem] leading-relaxed">{props.message}</p>
    </CardContent>
  ) : (
    <CardContent className="px-4">
      <p className="text-muted-foreground text-sm italic">
        {props.emptyHint ?? 'Nothing matched your rules yet today.'}
      </p>
    </CardContent>
  )

const TodayEntryEditor = (props: TodayEntryEditorProps) => (
  <CardContent className="space-y-2 px-4">
    <Textarea
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      rows={4}
      autoFocus
      aria-label="Timesheet comment"
      className="text-[0.9375rem] leading-relaxed"
    />
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={props.onCancel}>
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={props.onSave}
        disabled={props.saving || props.value.trim().length === 0}
      >
        {props.saving ? <Spinner /> : <Check className="size-4" />}
        Post this
      </Button>
    </div>
  </CardContent>
)

/** Shows which tickets produced each sentence, so a surprising message can be
 * traced back to the rule and ticket behind it. */
const TodayEntryBreakdown = (props: TodayEntryBreakdownProps) =>
  props.parts.length === 0 ? null : (
    <CardContent className="px-4">
      <ul className="space-y-2">
        {props.parts.map((part) => (
          <li key={part.prefix} className="text-xs">
            <p className="text-muted-foreground font-medium">{part.prefix}</p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {part.issues.map((issue) => (
                <li key={issue.id}>
                  <Badge variant="outline" className="font-normal">
                    <span className="font-mono">{issue.key}</span>
                    <span className="text-muted-foreground truncate">
                      {issue.summary}
                    </span>
                  </Badge>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </CardContent>
  )

const TodayEntryProblem = (props: TodayEntryProblemProps) => (
  <CardContent className="px-4">
    <p className="text-destructive flex items-start gap-2 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{props.message}</span>
    </p>
  </CardContent>
)

const TodayEntryActions = (props: TodayEntryActionsProps) => (
  <CardFooter className="gap-2 px-4">{props.children}</CardFooter>
)

const TodayEntryAction = (props: TodayEntryActionProps) => (
  <Button
    variant={props.variant ?? 'default'}
    size="sm"
    onClick={props.onClick}
    disabled={props.disabled || props.busy}
    className="flex-1"
  >
    {props.busy ? <Spinner /> : props.icon}
    {props.label}
  </Button>
)

export const TodayEntry = {
  Root: TodayEntryRoot,
  Heading: TodayEntryHeading,
  Status: TodayEntryStatus,
  Message: TodayEntryMessage,
  Editor: TodayEntryEditor,
  Breakdown: TodayEntryBreakdown,
  Problem: TodayEntryProblem,
  Actions: TodayEntryActions,
  Action: TodayEntryAction,
}
