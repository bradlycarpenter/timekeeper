import { Schema } from 'effect'
import { JiraIssue, JiraStatusId } from './Jira.ts'

export const StubId = Schema.String.pipe(Schema.brand('StubId'))
export type StubId = typeof StubId.Type

/** How a ticket's relationship to a status is judged for today. */
export const StatusCondition = Schema.Literals([
  'entered',
  'stationary',
  'left',
])
export type StatusCondition = typeof StatusCondition.Type

/** The database has stored these as integers since the first migration. */
export const statusConditionCodes = {
  entered: 0,
  stationary: 1,
  left: 2,
} as const satisfies Record<StatusCondition, number>

export const statusConditionByCode: Record<number, StatusCondition> = {
  0: 'entered',
  1: 'stationary',
  2: 'left',
}

export const statusConditionLabels = {
  entered: {
    label: 'moved into',
    hint: 'Tickets that reached this status today.',
  },
  stationary: {
    label: 'sat in',
    hint: 'Tickets that were already in this status before today and still are.',
  },
  left: {
    label: 'moved out of',
    hint: 'Tickets that left this status today.',
  },
} as const satisfies Record<StatusCondition, { label: string; hint: string }>

export const StubMessageId = Schema.Literals([0, 1, 2, 3])
export type StubMessageId = typeof StubMessageId.Type

export const stubMessages = [
  { id: 0, text: 'Today I began working on' },
  { id: 1, text: 'Today I continue work on' },
  { id: 2, text: 'Today I opened a pull request for' },
  { id: 3, text: 'Today I completed' },
] as const

export const stubMessageText = (id: StubMessageId): string =>
  stubMessages[id].text

export const Stub = Schema.Struct({
  id: StubId,
  statusId: JiraStatusId,
  statusName: Schema.String,
  condition: StatusCondition,
  messageId: StubMessageId,
})
export type Stub = typeof Stub.Type

export const StubDraft = Schema.Struct({
  statusId: JiraStatusId,
  statusName: Schema.String,
  condition: StatusCondition,
  messageId: StubMessageId,
})
export type StubDraft = typeof StubDraft.Type

/** What a draft rule would surface today, so the wizard can show it before the
 * rule is saved. */
export const StubPreview = Schema.Struct({
  issues: Schema.Array(JiraIssue),
  message: Schema.String,
})
export type StubPreview = typeof StubPreview.Type
