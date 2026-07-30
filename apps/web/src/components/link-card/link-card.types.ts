import type { ReactNode } from 'react'
import type { BoardSheet } from '@tk/domain'

export type LinkCardRootProps = {
  children: ReactNode
}

export type LinkCardHeadingProps = {
  clientName: string
  projectName: string
  boardName: string
  boardKey: string
}

export type LinkCardTermsProps = {
  hours: number
  costCodeId: BoardSheet.CostCodeId
}

export type LinkCardRuleCountProps = {
  count: number
}

export type LinkCardActionsProps = {
  children: ReactNode
}
