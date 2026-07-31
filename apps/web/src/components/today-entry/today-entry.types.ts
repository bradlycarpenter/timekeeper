import type { ReactNode } from 'react'
import type { Today } from '@tk/domain'

export type TodayEntryRootProps = {
  status: Today.PostStatus
  children: ReactNode
}

export type TodayEntryHeadingProps = {
  clientName: string
  projectName: string
  boardKey: string
  hours: number
  /** Marks the card as a fabricated example rather than a real entry. */
  sample?: boolean
}

export type TodayEntryStatusProps = {
  status: Today.PostStatus
}

export type TodayEntryMessageProps = {
  message: string
  emptyHint?: string
}

export type TodayEntryEditorProps = {
  value: string
  onChange: (value: string) => void
  onCancel: () => void
  onSave: () => void
  saving: boolean
}

export type TodayEntryBreakdownProps = {
  parts: Today.Today['entries'][number]['parts']
}

export type TodayEntryProblemProps = {
  message: string
  action?: ReactNode
}

export type TodayEntryPreviewProps = {
  /** Says plainly that the tickets below are invented. */
  label: string
  message: string
}

export type TodayEntryActionsProps = {
  children: ReactNode
}

export type TodayEntryActionProps = {
  label: string
  icon?: ReactNode
  onClick: () => void
  busy?: boolean
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
}
