import type { ReactNode } from 'react'
import type { Warp } from '@tk/domain'

export type EntryListRootProps = {
  children: ReactNode
}

export type EntryListMonthProps = {
  label: string
  onPrevious: () => void
  onNext: () => void
  /** Paging forward past the current month has nothing to show. */
  nextDisabled?: boolean
  totalHours: number
  overtimeHours: number
  days: number
}

export type EntryListDayProps = {
  label: string
  weekday: string
  entries: ReadonlyArray<Warp.SheetEntry>
  /** A working day with nothing logged is the thing this page exists to surface,
   * so it is rendered rather than skipped. */
  empty?: boolean
}

export type EntryListTruncatedProps = {
  coveredThrough: string
}
