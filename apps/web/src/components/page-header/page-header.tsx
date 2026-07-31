import type {
  PageHeaderActionProps,
  PageHeaderRootProps,
  PageHeaderTitleProps,
} from './page-header.types.ts'

const PageHeaderRoot = (props: PageHeaderRootProps) => (
  <div className="mb-6 flex items-end justify-between gap-3">
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
