import { Schema } from 'effect'
import { BoardSheetId } from './BoardSheet.ts'
import { JiraIssue } from './Jira.ts'

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

export const TodayEntry = Schema.Struct({
  boardSheetId: BoardSheetId,
  sheetName: Schema.String,
  sheetClientName: Schema.String,
  boardKey: Schema.String,
  hours: Schema.Number,
  status: PostStatus,
  message: Schema.String,
  parts: Schema.Array(MessagePart),
  entryId: Schema.optional(Schema.Number),
  error: Schema.optional(Schema.String),
})
export type TodayEntry = typeof TodayEntry.Type

export const Today = Schema.Struct({
  date: EntryDate,
  postsAt: Schema.String,
  entries: Schema.Array(TodayEntry),
  totalHours: Schema.Number,
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
