import type { ReactNode } from 'react'
import type { Jira, Stub } from '@tk/domain'
import type { AsyncResult } from 'effect/unstable/reactivity'

export type RuleRootProps = {
  children: ReactNode
}

export type RuleRowProps = {
  boardKey: string
  statusId: Jira.JiraStatusId
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
  /** The live ticket preview for this rule. Omit while the draft has no
   * status yet — the static sentence still renders on its own. */
  preview?: AsyncResult.AsyncResult<Stub.StubPreview, unknown> | undefined
}

