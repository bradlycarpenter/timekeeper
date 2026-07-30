import type { Stub, Today } from '@tk/domain'
import { Message, Stub as StubDomain } from '@tk/domain'

export type SampleTodayEntry = {
  sheetClientName: string
  sheetName: string
  boardKey: string
  hours: number
  message: string
  parts: ReadonlyArray<Today.MessagePart>
}

/** Plausible ticket numbers and summaries per sentence opener, reused across
 * whichever board the sample is drawn for so the fabricated key still reads
 * as belonging to that board (`${boardKey}-${number}`). */
const SAMPLE_ISSUE_POOL: Record<
  Stub.StubMessageId,
  ReadonlyArray<{ number: number; summary: string }>
> = {
  0: [{ number: 214, summary: 'Add CSV export to invoices' }],
  1: [{ number: 198, summary: 'Refactor billing sync worker' }],
  2: [{ number: 226, summary: 'Add CSV export to invoices' }],
  3: [
    { number: 187, summary: 'Fix duplicate entries on retry' },
    { number: 193, summary: 'Tidy up onboarding emails' },
  ],
}

const sampleIssuesFor = (boardKey: string, messageId: Stub.StubMessageId) =>
  SAMPLE_ISSUE_POOL[messageId].map((issue) => ({
    id: `${boardKey}-${issue.number}`,
    key: `${boardKey}-${issue.number}`,
    summary: issue.summary,
  }))

/** A stub's rule (status, condition) does not change the sentence, only its
 * `messageId` does, so a sample part only needs that. */
export const samplePartFor = (
  boardKey: string,
  stub: Pick<Stub.Stub, 'messageId'>,
): Today.MessagePart => ({
  prefix: StubDomain.stubMessageText(stub.messageId),
  issues: sampleIssuesFor(boardKey, stub.messageId),
})

/** Builds what this link's real rules would produce if they matched today,
 * using its real sentence openers and board key with fabricated tickets. */
export const sampleEntryFor = (link: {
  sheetClientName: string
  sheetName: string
  boardKey: string
  hours: number
  ruleMessageIds: ReadonlyArray<Stub.StubMessageId>
}): SampleTodayEntry => {
  const parts = link.ruleMessageIds.map((messageId) =>
    samplePartFor(link.boardKey, { messageId }),
  )
  return {
    sheetClientName: link.sheetClientName,
    sheetName: link.sheetName,
    boardKey: link.boardKey,
    hours: link.hours,
    message: Message.composeMessage(parts),
    parts,
  }
}

/** Fully fabricated demo for a user with no links yet — nothing real to draw
 * from, so the board, client and rules are invented outright. */
export const demoEntry: SampleTodayEntry = sampleEntryFor({
  sheetClientName: 'Lumix',
  sheetName: 'Development',
  boardKey: 'LUM',
  hours: 8,
  ruleMessageIds: [0, 3],
})
