import { CalendarDays, Clock } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import type {
  DaySummaryHoursProps,
  DaySummaryRootProps,
  DaySummaryTitleProps,
} from './day-summary.types.ts'

const DaySummaryRoot = (props: DaySummaryRootProps) => (
  <div className="mb-4 flex items-end justify-between gap-3">
    {props.children}
  </div>
)

const DaySummaryTitle = (props: DaySummaryTitleProps) => (
  <div>
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
      <CalendarDays className="size-3.5" />
      {props.eyebrow}
    </p>
    <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
      {props.date}
    </h1>
  </div>
)

/** A day that does not add up to the expected total is the most common mistake
 * with more than one link, so the total is called out rather than just shown. */
const DaySummaryHours = (props: DaySummaryHoursProps) => {
  const balanced = props.total === props.expected
  return (
    <Badge
      variant={balanced ? 'secondary' : 'outline'}
      className={cn(
        'gap-1 tabular-nums',
        !balanced &&
          'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
      )}
    >
      <Clock className="size-3.5" />
      {props.total}h of {props.expected}h
    </Badge>
  )
}

export const DaySummary = {
  Root: DaySummaryRoot,
  Title: DaySummaryTitle,
  Hours: DaySummaryHours,
}
