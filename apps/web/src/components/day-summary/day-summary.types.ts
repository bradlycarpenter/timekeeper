import type { ReactNode } from 'react'

export type DaySummaryRootProps = {
  children: ReactNode
}

export type DaySummaryTitleProps = {
  eyebrow: string
  date: string
}

export type DaySummaryHoursProps = {
  total: number
  expected: number
}
