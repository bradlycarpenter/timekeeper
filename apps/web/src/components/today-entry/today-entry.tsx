import { AlertTriangle, Check, Sparkles } from 'lucide-react'
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
  TodayEntryPreviewProps,
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
        {props.sample ? (
          <Badge className="gap-1 border-0 bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
            <Sparkles className="size-3" />
            Example
          </Badge>
        ) : null}
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
      <p className="max-w-[70ch] text-[0.9375rem] leading-relaxed">
        {props.message}
      </p>
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
      <Button variant="ghost" className="h-11 md:h-8" onClick={props.onCancel}>
        Cancel
      </Button>
      <Button
        className="h-11 md:h-8"
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
  <CardContent className="space-y-2 px-4">
    <p className="text-destructive flex items-start gap-2 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{props.message}</span>
    </p>
    {props.action ? <div className="pl-6">{props.action}</div> : null}
  </CardContent>
)

/** Fabricated content renders here and never through Message/Breakdown. The
 * sample is deliberately built from the link's real board key, so `LUM-214`
 * looks exactly as real as a matched ticket and presentation is the only thing
 * separating them: this is muted, inset, dashed and labelled, and it states the
 * tickets are invented rather than leaving that to a caption above full-weight
 * body text. The ticket chips are dropped too — one statement of the fiction is
 * enough where the old layout printed it twice. */
const TodayEntryPreview = (props: TodayEntryPreviewProps) => (
  <CardContent className="px-4">
    <div className="border-muted-foreground/25 bg-muted/40 rounded-lg border border-dashed p-3">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <Sparkles className="size-3.5" />
        {props.label}
      </p>
      <p className="text-muted-foreground mt-1.5 max-w-[70ch] text-sm leading-relaxed">
        {props.message}
      </p>
    </div>
  </CardContent>
)

const TodayEntryActions = (props: TodayEntryActionsProps) => (
  <CardFooter className="gap-2 px-4">{props.children}</CardFooter>
)

/** Posting the day is the app's primary action, and on a phone it is a thumb
 * target: 44px is the comfortable minimum, and the variant scale deliberately
 * tops out at 36px, so the height is overridden here rather than by stretching
 * the scale for everything. Back to the compact scale from `md` up, where the
 * pointer is a mouse. */
const TodayEntryAction = (props: TodayEntryActionProps) => (
  <Button
    variant={props.variant ?? 'default'}
    onClick={props.onClick}
    disabled={props.disabled || props.busy}
    className="h-11 flex-1 md:h-8"
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
  Preview: TodayEntryPreview,
  Actions: TodayEntryActions,
  Action: TodayEntryAction,
}
