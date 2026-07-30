import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import type {
  HistoryListRootProps,
  HistoryListRowProps,
} from './history-list.types.ts'

const statusLabels = {
  posted: { label: 'Posted', className: 'text-emerald-700 dark:text-emerald-400' },
  skipped: { label: 'Skipped', className: 'text-muted-foreground' },
  failed: { label: 'Failed', className: 'text-destructive' },
  queued: { label: 'Sending', className: 'text-amber-700 dark:text-amber-400' },
  pending: { label: 'Scheduled', className: 'text-primary' },
} as const

const HistoryListRoot = (props: HistoryListRootProps) => (
  <ul className="divide-y rounded-lg border">{props.children}</ul>
)

const HistoryListRow = (props: HistoryListRowProps) => {
  const status = statusLabels[props.status]
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{props.date}</p>
          <Badge variant="outline" className="font-mono text-[0.6875rem]">
            {props.boardKey}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {props.message ?? props.sheetName}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn('text-xs font-medium', status.className)}>
          {status.label}
        </p>
        {props.hours > 0 ? (
          <p className="text-muted-foreground text-xs tabular-nums">
            {props.hours}h
          </p>
        ) : null}
      </div>
    </li>
  )
}

export const HistoryList = {
  Root: HistoryListRoot,
  Row: HistoryListRow,
}
