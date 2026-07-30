import { Schema } from 'effect'
import { JiraProject, JiraProjectId } from './Jira.ts'
import { Stub } from './Stub.ts'
import { WarpTaskId } from './Warp.ts'

export const BoardSheetId = Schema.String.pipe(Schema.brand('BoardSheetId'))
export type BoardSheetId = typeof BoardSheetId.Type

export const CostCodeId = Schema.Number.pipe(Schema.brand('CostCodeId'))
export type CostCodeId = typeof CostCodeId.Type

/** Warp accepts fractional time, and a day is only ever split between links, so
 * anything above a full day is rejected outright. */
export const Hours = Schema.Number.check(
  Schema.isGreaterThan(0),
  Schema.isLessThanOrEqualTo(24),
  Schema.isMultipleOf(0.25),
)

export const DEFAULT_HOURS = 8
export const DEFAULT_COST_CODE_ID = 2

/** A Jira project (board) linked to a Warp project (sheet): the unit Timekeeper
 * posts one timesheet entry for each working day. */
export const BoardSheet = Schema.Struct({
  id: BoardSheetId,
  sheetTaskId: WarpTaskId,
  sheetName: Schema.String,
  sheetClientName: Schema.String,
  boardId: JiraProjectId,
  boardName: Schema.String,
  boardKey: Schema.String,
  hours: Hours,
  costCodeId: CostCodeId,
  stubs: Schema.Array(Stub),
})
export type BoardSheet = typeof BoardSheet.Type

export const SheetSelection = Schema.Struct({
  taskId: WarpTaskId,
  name: Schema.String,
  clientName: Schema.String,
})

export const BoardSheetDraft = Schema.Struct({
  sheet: SheetSelection,
  board: JiraProject,
  hours: Hours,
  costCodeId: CostCodeId,
})
export type BoardSheetDraft = typeof BoardSheetDraft.Type

export const BoardSheetPatch = Schema.Struct({
  hours: Schema.optional(Hours),
  costCodeId: Schema.optional(CostCodeId),
})
export type BoardSheetPatch = typeof BoardSheetPatch.Type
