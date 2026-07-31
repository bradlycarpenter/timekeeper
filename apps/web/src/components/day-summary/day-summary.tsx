import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import type { DaySummaryTallyProps } from './day-summary.types.ts'

/** The day's footing, and the answer to the only question this screen exists to
 * answer: is the day covered. It leads the screen on its own line rather than
 * sitting in the header's corner, because the date is identity and this is
 * state. A day that does not add up to the expected total is the most common
 * mistake with more than one link, so the total is called out rather than shown. */
const DaySummaryTally = (props: DaySummaryTallyProps) => {
  const settled = props.filed + props.skipped === props.total
  const balanced = props.hours === props.expected

  const label = !settled
    ? `${props.filed} of ${props.total} filed`
    : props.skipped === 0
      ? `All ${props.total} filed`
      : `${props.filed} filed, ${props.skipped} skipped`

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Badge
          className={cn(
            'gap-1 rounded-full border-0',
            settled
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {settled ? (
            <CheckCircle2 className="size-3.5" />
          ) : (
            <Circle className="size-3.5" />
          )}
          {label}
        </Badge>
        {settled ? null : (
          <span className="text-muted-foreground truncate text-xs">
            posts at {props.postsAt}
          </span>
        )}
      </div>

      <Badge
        variant={balanced ? 'secondary' : 'outline'}
        className={cn(
          'gap-1 tabular-nums',
          !balanced &&
            'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
        )}
      >
        <Clock className="size-3.5" />
        {props.hours}h of {props.expected}h
      </Badge>
    </div>
  )
}

export const DaySummary = {
  Tally: DaySummaryTally,
}
