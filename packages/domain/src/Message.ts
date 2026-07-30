import type { JiraIssue } from './Jira.ts'
import type { Stub } from './Stub.ts'
import { stubMessageText } from './Stub.ts'
import type { MessagePart } from './Today.ts'

const describeIssue = (issue: JiraIssue) => `${issue.key} (${issue.summary})`

/** Renders one sentence per rule that matched, reading as prose:
 * "Today I completed AB-1 (One), AB-2 (Two) and AB-3 (Three)." Shared between
 * the real compose path and the today-screen sample preview so the two never
 * drift into different wording. */
export const composeMessage = (
  parts: ReadonlyArray<MessagePart>,
): string =>
  parts
    .filter((part) => part.issues.length > 0)
    .map((part) => {
      const described = part.issues.map(describeIssue)
      const last = described[described.length - 1]!
      const list =
        described.length === 1
          ? last
          : `${described.slice(0, -1).join(', ')} and ${last}`
      return `${part.prefix} ${list}.`
    })
    .join(' ')

export const partFor = (
  stub: Stub,
  issues: ReadonlyArray<JiraIssue>,
): MessagePart => ({
  prefix: stubMessageText(stub.messageId),
  issues,
})
