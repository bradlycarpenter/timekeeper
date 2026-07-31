import type {
  PageHeaderActionProps,
  PageHeaderRootProps,
  PageHeaderTitleProps,
} from './page-header.types.ts'

/** Stacks below `sm`: a 44px action beside a wrapping description squeezes the
 * description into three lines on a phone, so the action drops beneath the title
 * instead of competing with it for the same row. */
const PageHeaderRoot = (props: PageHeaderRootProps) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    {props.children}
  </div>
)

const PageHeaderTitle = (props: PageHeaderTitleProps) => (
  <div className="min-w-0">
    <h1 className="text-2xl font-semibold tracking-tight">{props.heading}</h1>
    {props.description ? (
      <p className="text-muted-foreground mt-1 text-sm">{props.description}</p>
    ) : null}
  </div>
)

const PageHeaderAction = (props: PageHeaderActionProps) => (
  <div className="shrink-0">{props.children}</div>
)

export const PageHeader = {
  Root: PageHeaderRoot,
  Title: PageHeaderTitle,
  Action: PageHeaderAction,
}
