import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Moon } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type {
  EntryListDayProps,
  EntryListMonthProps,
  EntryListRootProps,
  EntryListTruncatedProps,
} from './entry-list.types.ts'

const EntryListRoot = (props: EntryListRootProps) => (
  <div className="divide-border divide-y border-t">{props.children}</div>
)

const EntryListMonth = (props: EntryListMonthProps) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Previous month"
        onClick={props.onPrevious}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-40 text-center text-sm font-medium">
        {props.label}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Next month"
        disabled={props.nextDisabled}
        onClick={props.onNext}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>

    <div className="flex items-center gap-1.5">
      <Badge variant="secondary" className="gap-1 tabular-nums">
        <Clock className="size-3.5" />
        {props.totalHours}h over {props.days} {props.days === 1 ? 'day' : 'days'}
      </Badge>
      {props.overtimeHours > 0 ? (
        <Badge className="gap-1 border-0 bg-indigo-100 text-indigo-900 tabular-nums dark:bg-indigo-950 dark:text-indigo-300">
          <Moon className="size-3.5" />+{props.overtimeHours}h OT
        </Badge>
      ) : null}
    </div>
  </div>
)

/** The date column is fixed-width and tabular so the dates form a straight edge
 * to scan down, rather than shifting with the length of each day's name. */
const EntryListDay = (props: EntryListDayProps) => (
  <div
    className={cn(
      'flex gap-4 py-3',
      props.empty && 'text-muted-foreground',
    )}
  >
    <div className="w-20 shrink-0">
      <p className="text-sm tabular-nums">{props.label}</p>
      <p className="text-muted-foreground text-xs">{props.weekday}</p>
    </div>

    <div className="min-w-0 flex-1 space-y-2">
      {props.empty ? (
        <p className="text-sm italic">Nothing logged.</p>
      ) : (
        props.entries.map((entry) => (
          <div key={entry.entryId}>
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 truncate text-sm font-medium">
                {entry.clientName} · {entry.projectName}
              </p>
              <span className="flex shrink-0 items-center gap-1.5">
                {entry.overtime ? (
                  <Badge className="gap-1 border-0 bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
                    <Moon className="size-3" />
                    OT
                  </Badge>
                ) : null}
                <span className="text-sm tabular-nums">{entry.hours}h</span>
              </span>
            </div>
            {entry.description ? (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 max-w-[80ch] text-xs">
                {entry.description}
              </p>
            ) : null}
          </div>
        ))
      )}
    </div>
  </div>
)

/** Warp pages over the whole company, so a wide window can run out of budget.
 * Saying so is better than showing a short list as if it were the whole month. */
const EntryListTruncated = (props: EntryListTruncatedProps) => (
  <div className="border-destructive/30 bg-destructive/5 mt-4 flex items-start gap-2 rounded-lg border p-3">
    <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
    <p className="text-sm">
      Only entries up to {props.coveredThrough} could be read. Pick a narrower
      range to see the rest.
    </p>
  </div>
)

export const EntryList = {
  Root: EntryListRoot,
  Month: EntryListMonth,
  Day: EntryListDay,
  Truncated: EntryListTruncated,
}
