import { Schema } from 'effect'
import { BoardSheetId } from './BoardSheet.ts'
import { JiraIssue } from './Jira.ts'
import { StubMessageId } from './Stub.ts'

/** Entry dates are calendar days in the user's working timezone, never
 * timestamps, because Warp bills against a date. */
export const EntryDate = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/),
).pipe(Schema.brand('EntryDate'))
export type EntryDate = typeof EntryDate.Type

export const PostStatus = Schema.Literals([
  'pending',
  'queued',
  'posted',
  'skipped',
  'failed',
])
export type PostStatus = typeof PostStatus.Type

/** One stub's contribution to the day's message, kept separate so the UI can
 * show which tickets drove which sentence. */
export const MessagePart = Schema.Struct({
  prefix: Schema.String,
  issues: Schema.Array(JiraIssue),
})
export type MessagePart = typeof MessagePart.Type

/** Hours a single ticket was billed outside the normal day. Warp's overtime is
 * a per-entry flag, so each of these posts as its own entry alongside — never
 * inside — the link's normal one. */
export const OvertimeEntry = Schema.Struct({
  issueKey: Schema.String,
  issueSummary: Schema.String,
  hours: Schema.Number,
  status: PostStatus,
  entryId: Schema.optional(Schema.Number),
  error: Schema.optional(Schema.String),
})
export type OvertimeEntry = typeof OvertimeEntry.Type

/** Hours must land on Warp's quarter-hour grid, and no single ticket is a day's
 * worth of overtime on its own. */
export const OvertimeHours = Schema.Number.check(
  Schema.isGreaterThan(0),
  Schema.isLessThanOrEqualTo(12),
  Schema.isMultipleOf(0.25),
)

export const OvertimeDraft = Schema.Struct({
  issueKey: Schema.String,
  issueSummary: Schema.String,
  hours: OvertimeHours,
})
export type OvertimeDraft = typeof OvertimeDraft.Type

export const TodayEntry = Schema.Struct({
  boardSheetId: BoardSheetId,
  sheetName: Schema.String,
  sheetClientName: Schema.String,
  boardKey: Schema.String,
  hours: Schema.Number,
  status: PostStatus,
  message: Schema.String,
  parts: Schema.Array(MessagePart),
  /** Whether the link has any rules configured at all, kept separate from an
   * empty `message` so the UI can tell "nothing to write yet" (no rules) apart
   * from "rules exist, nothing matched today". */
  hasRules: Schema.Boolean,
  /** The sentence opener each configured rule would use, so the UI can preview
   * what this link's own rules would produce even when none matched today. */
  ruleMessageIds: Schema.Array(StubMessageId),
  /** Tickets pulled out of this entry and billed as overtime. Their hours are
   * additional to `hours`, and their keys are excluded from `message`. */
  overtime: Schema.Array(OvertimeEntry),
  entryId: Schema.optional(Schema.Number),
  error: Schema.optional(Schema.String),
})
export type TodayEntry = typeof TodayEntry.Type

export const Today = Schema.Struct({
  date: EntryDate,
  postsAt: Schema.String,
  entries: Schema.Array(TodayEntry),
  /** Normal hours only, so it can be read against `standardHours` directly. */
  totalHours: Schema.Number,
  overtimeHours: Schema.Number,
  standardHours: Schema.Number,
})
export type Today = typeof Today.Type

export const HistoryEntry = Schema.Struct({
  boardSheetId: BoardSheetId,
  entryDate: EntryDate,
  sheetName: Schema.String,
  boardKey: Schema.String,
  hours: Schema.Number,
  status: PostStatus,
  message: Schema.optional(Schema.String),
  entryId: Schema.optional(Schema.Number),
  error: Schema.optional(Schema.String),
})
export type HistoryEntry = typeof HistoryEntry.Type

export const PostNow = Schema.Struct({
  message: Schema.optional(Schema.String),
})
export type PostNow = typeof PostNow.Type
