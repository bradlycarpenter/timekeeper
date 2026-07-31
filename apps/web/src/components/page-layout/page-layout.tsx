import { cn } from '#/lib/utils'
import type {
  PageLayoutAsideProps,
  PageLayoutMainProps,
  PageLayoutRootProps,
  PageLayoutSplitProps,
} from './page-layout.types.ts'

/** The measure is the page's decision, not the shell's. A single global cap
 * made every screen the same width whether it held a paragraph or a table. */
const PageLayoutRoot = (props: PageLayoutRootProps) => (
  <div
    className={cn(
      'mx-auto w-full',
      props.width === 'wide' ? 'max-w-5xl' : 'max-w-3xl',
    )}
  >
    {props.children}
  </div>
)

/** Two columns, and only two: the second carries state and reference, never
 * more of the primary work. The ledger still reads top to bottom in one column
 * — what moves aside is what you consult, not what you act on. Collapsed, it
 * returns to that single column in DOM order, so the aside follows the entries
 * rather than pushing them down the page.
 *
 * `xl`, not `lg`: the 15rem rail and 4rem of gutter come off the viewport
 * first, so at 1024px a second column would leave the entries around 25rem —
 * narrower than the single column it replaced. */
const PageLayoutSplit = (props: PageLayoutSplitProps) => (
  <div className="mx-auto grid w-full max-w-3xl grid-cols-1 items-start gap-x-10 gap-y-8 xl:max-w-6xl xl:grid-cols-[minmax(0,1fr)_19rem]">
    {props.children}
  </div>
)

const PageLayoutMain = (props: PageLayoutMainProps) => (
  <div className="min-w-0">{props.children}</div>
)

/** Sticks so it stays on screen while you work down the entries. It carries its
 * own scroll because the list it holds is 30 rows: a sticky column taller than
 * the viewport just scrolls away and takes its own tail with it. */
const PageLayoutAside = (props: PageLayoutAsideProps) => (
  <aside className="min-w-0 xl:sticky xl:top-8 xl:max-h-[calc(100dvh-4rem)] xl:overflow-y-auto xl:overscroll-contain">
    {props.children}
  </aside>
)

export const PageLayout = {
  Root: PageLayoutRoot,
  Split: PageLayoutSplit,
  Main: PageLayoutMain,
  Aside: PageLayoutAside,
}
