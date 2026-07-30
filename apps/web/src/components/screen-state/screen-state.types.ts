import type { ReactNode } from 'react'

export type ScreenStateLoadingProps = {
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
  children: ReactNode
}
