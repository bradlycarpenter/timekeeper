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
  /** Omitted for samples and settled days, where marking would be meaningless. */
  onMarkOvertime?: (issue: { key: string; summary: string }) => void
}

export type TodayEntryOvertimeProps = {
  entries: ReadonlyArray<Today.OvertimeEntry>
  /** Omitted once the day is settled, when nothing can be unmarked. */
  onClear?: (issueKey: string) => void
  busyKey?: string
}

export type TodayEntryOvertimeFormProps = {
  issue: { key: string; summary: string }
  hours: number
  onHoursChange: (hours: number) => void
  onConfirm: () => void
  onCancel: () => void
  saving?: boolean
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
