import type { ReactNode } from 'react'

export type ScreenStateLoadingProps = {
  /** The real composition, filled with placeholder text. Preferred over
   * `cards`: it cannot drift from the layout it stands in for. */
  children?: ReactNode
  cards?: number
}

export type ScreenStateFailedProps = {
  title: string
  detail: string
  onRetry?: (() => void) | undefined
}

export type ScreenStateEmptyProps = {
  icon: ReactNode
  title: string
  detail: string
  children?: ReactNode
}

export type ScreenStateSectionProps = {
  title: string
  description?: string | undefined
  action?: ReactNode
  /** Drops the leading section gap, for a section that already starts a column
   * rather than following content down the page. */
  flush?: boolean
  children: ReactNode
}
