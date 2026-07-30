import type { Jira, Stub, Today } from '@tk/domain'
import { Stub as StubDomain } from '@tk/domain'

/** JQL is assembled from a board key and a status id, both of which come from
 * Jira itself, so the status id is quoted to survive ids that are not bare
 * numbers. */
export const jqlForStub = (boardKey: string, stub: Stub.Stub): string => {
  const scope = `project = "${boardKey}" AND assignee = currentUser()`
  const status = `"${stub.statusId}"`

  switch (stub.condition) {
    case 'entered':
      return `${scope} AND status CHANGED TO ${status} AFTER startOfDay() AND status = ${status}`
    case 'stationary':
      return `${scope} AND status = ${status} AND status WAS ${status} DURING (startOfDay(-1d), endOfDay(-1d)) AND NOT status CHANGED TO ${status} AFTER startOfDay()`
    case 'left':
      return `${scope} AND status CHANGED FROM ${status} AFTER startOfDay() AND status != ${status}`
  }
}

const describeIssue = (issue: Jira.JiraIssue) =>
  `${issue.key} (${issue.summary})`

/** Renders one sentence per rule that matched, reading as prose:
 * "Today I completed AB-1 (One), AB-2 (Two) and AB-3 (Three)." */
export const composeMessage = (
  parts: ReadonlyArray<Today.MessagePart>,
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
  stub: Stub.Stub,
  issues: ReadonlyArray<Jira.JiraIssue>,
): Today.MessagePart => ({
  prefix: StubDomain.stubMessageText(stub.messageId),
  issues,
})
