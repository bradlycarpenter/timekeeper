import { AlertTriangle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import type {
  ScreenStateEmptyProps,
  ScreenStateFailedProps,
  ScreenStateLoadingProps,
  ScreenStateSectionProps,
} from './screen-state.types.ts'

/** Skeletons match the real card's shape so the page does not jump when the data
 * lands. */
const ScreenStateLoading = (props: ScreenStateLoadingProps) => (
  <div className="space-y-3">
    {Array.from({ length: props.cards ?? 2 }, (_, index) => (
      <div key={index} className="rounded-lg border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </div>
    ))}
  </div>
)

const ScreenStateFailed = (props: ScreenStateFailedProps) => (
  <div className="border-destructive/30 bg-destructive/5 rounded-lg border px-4 py-6 text-center">
    <AlertTriangle className="text-destructive mx-auto size-5" />
    <p className="mt-2 text-sm font-medium">{props.title}</p>
    <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
      {props.detail}
    </p>
    {props.onRetry ? (
      <Button variant="outline" size="sm" className="mt-4" onClick={props.onRetry}>
        Try again
      </Button>
    ) : null}
  </div>
)

const ScreenStateEmpty = (props: ScreenStateEmptyProps) => (
  <div className="border-muted rounded-lg border border-dashed px-4 py-10 text-center">
    <div className="text-muted-foreground mx-auto flex size-10 items-center justify-center">
      {props.icon}
    </div>
    <p className="mt-1 font-medium">{props.title}</p>
    <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">
      {props.detail}
    </p>
    {props.children ? <div className="mt-5">{props.children}</div> : null}
  </div>
)

const ScreenStateSection = (props: ScreenStateSectionProps) => (
  <section className="mt-8 space-y-3">
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="font-semibold tracking-tight">{props.title}</h2>
        {props.description ? (
          <p className="text-muted-foreground text-sm">{props.description}</p>
        ) : null}
      </div>
      {props.action}
    </div>
    {props.children}
  </section>
)

export const ScreenState = {
  Loading: ScreenStateLoading,
  Failed: ScreenStateFailed,
  Empty: ScreenStateEmpty,
  Section: ScreenStateSection,
}
