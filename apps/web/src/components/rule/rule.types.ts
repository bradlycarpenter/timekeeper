import type { ReactNode } from 'react'
import type { Jira, Stub } from '@tk/domain'

export type RuleRootProps = {
  children: ReactNode
}

export type RuleRowProps = {
  statusName: string
  condition: Stub.StatusCondition
  messageId: Stub.StubMessageId
  onRemove: () => void
  removing: boolean
}

export type RuleEmptyProps = {
  children?: ReactNode
}

export type RuleStatusFieldProps = {
  categories: ReadonlyArray<Jira.JiraStatusCategory>
  value: Jira.JiraStatusId | undefined
  onChange: (status: Jira.JiraStatus) => void
}

export type RuleConditionFieldProps = {
  value: Stub.StatusCondition
  onChange: (condition: Stub.StatusCondition) => void
}

export type RuleMessageFieldProps = {
  value: Stub.StubMessageId
  onChange: (messageId: Stub.StubMessageId) => void
}

export type RulePreviewProps = {
  statusName: string | undefined
  condition: Stub.StatusCondition
  messageId: Stub.StubMessageId
}
