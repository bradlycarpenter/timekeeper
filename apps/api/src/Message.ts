import type { Stub } from '@tk/domain'
import { Message as MessageDomain } from '@tk/domain'

/** JQL is assembled from a board key and a status id, both of which come from
 * Jira itself, so the status id is quoted to survive ids that are not bare
 * numbers. Takes a `StubDraft` rather than a `Stub` since a draft being
 * previewed before save has no id yet, and this never reads one. */
export const jqlForStub = (boardKey: string, stub: Stub.StubDraft): string => {
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

/** Composition itself lives in `@tk/domain` so the web app's sample preview
 * can reuse the exact same wording instead of a second copy drifting apart. */
export const composeMessage = MessageDomain.composeMessage
export const partFor = MessageDomain.partFor
export const excludeIssues = MessageDomain.excludeIssues
