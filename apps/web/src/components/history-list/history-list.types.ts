import type { ReactNode } from 'react'
import type { Today } from '@tk/domain'

export type HistoryListRootProps = {
  children: ReactNode
}

export type HistoryListRowProps = {
  date: string
  boardKey: string
  sheetName: string
  message?: string | undefined
  hours: number
  status: Today.PostStatus
}
