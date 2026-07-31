import { AlertTriangle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/utils'
import type {
  ScreenStateEmptyProps,
  ScreenStateFailedProps,
  ScreenStateLoadingProps,
  ScreenStateSectionProps,
} from './screen-state.types.ts'

/** Pass the real composition as `children`, filled with representative
 * placeholder text; its text is redacted to bars by `[data-skeleton]`. Because
 * it is the actual component, its padding, type scale, control heights and
 * responsive behaviour cannot drift from what replaces it.
 *
 * The old version was a hand-built copy that claimed to match the entry card
 * and did not: `border` where the card uses `ring-1`, uniform `p-4` against the
 * card's `py-4` plus `gap-3`, 16px bars for 24px line boxes, `space-y-3`
 * between cards where the list uses `space-y-6`, and no action row at all
 * against three 44px buttons. The page jumped by more than 60px per card.
 *
 * `cards` still renders a generic stand-in for screens whose real composition
 * is not worth reproducing, but prefer `children`. */
const ScreenStateLoading = (props: ScreenStateLoadingProps) => (
  <div
    data-skeleton=""
    aria-hidden="true"
    className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
  >
    {props.children ?? (
      <div className="space-y-6">
        {Array.from({ length: props.cards ?? 2 }, (_, index) => (
          <div key={index} className="ring-foreground/10 rounded-lg py-4 ring-1">
            <div className="flex items-start justify-between gap-3 px-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Client name</p>
                <p className="text-sm">Project name</p>
              </div>
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <div className="mt-3 px-4">
              <p className="text-[0.9375rem] leading-relaxed">
                Loading the entry for this board, which usually runs to about
                this much text.
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const ScreenStateFailed = (props: ScreenStateFailedProps) => (
  <div className="border-destructive/30 bg-destructive/5 rounded-lg border px-4 py-6 text-center">
    <AlertTriangle className="text-destructive mx-auto size-5" />
    <p className="mt-2 font-medium">{props.title}</p>
    <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
      {props.detail}
    </p>
    {props.onRetry ? (
      <Button variant="outline" className="mt-4 h-11 md:h-8" onClick={props.onRetry}>
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

/** The section heading takes the headline step (1.25rem) rather than inheriting
 * 1rem, so it outranks the 1rem card titles beneath it instead of tying with
 * them. Scale reads 1.5rem page / 1.25rem section / 1rem card. */
const ScreenStateSection = (props: ScreenStateSectionProps) => (
  <section className={cn('space-y-3', props.flush ? 'mt-0' : 'mt-10')}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight">{props.title}</h2>
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
