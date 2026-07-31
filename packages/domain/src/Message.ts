import type { JiraIssue } from './Jira.ts'
import type { StubDraft } from './Stub.ts'
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

/** Drops the named tickets and any sentence left empty by their removal. Used
 * to hold overtime tickets out of the normal entry, since they are billed on
 * their own Warp entries and would otherwise be described twice. */
export const excludeIssues = (
  parts: ReadonlyArray<MessagePart>,
  issueKeys: ReadonlyArray<string>,
): ReadonlyArray<MessagePart> => {
  if (issueKeys.length === 0) return parts
  const excluded = new Set(issueKeys)
  return parts
    .map((part) => ({
      ...part,
      issues: part.issues.filter((issue) => !excluded.has(issue.key)),
    }))
    .filter((part) => part.issues.length > 0)
}

/** Takes a `StubDraft`, not a `Stub`: a rule being previewed before save has no
 * id yet, and only `messageId` is ever read. A saved `Stub` satisfies this too. */
export const partFor = (
  stub: StubDraft,
  issues: ReadonlyArray<JiraIssue>,
): MessagePart => ({
  prefix: stubMessageText(stub.messageId),
  issues,
})
