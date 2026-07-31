import { Schema } from 'effect'

export const WarpTaskId = Schema.Number.pipe(Schema.brand('WarpTaskId'))
export type WarpTaskId = typeof WarpTaskId.Type

export const WarpPersonId = Schema.Number.pipe(Schema.brand('WarpPersonId'))
export type WarpPersonId = typeof WarpPersonId.Type

export const WarpClient = Schema.Struct({
  GroupId: Schema.Number,
  Name: Schema.String,
  Currency: Schema.String,
})

/** Warp's API is PascalCase and this schema mirrors it verbatim, so the decoded
 * shape is what the upstream returns rather than a house style. */
export const WarpProject = Schema.Struct({
  TaskId: WarpTaskId,
  Name: Schema.String,
  IsActive: Schema.Boolean,
  Created_On: Schema.String,
  Updated_On: Schema.String,
  Client: WarpClient,
})
export type WarpProject = typeof WarpProject.Type

export const WarpPerson = Schema.Struct({
  PersonId: WarpPersonId,
  FirstName: Schema.String,
  Surname: Schema.String,
  Email: Schema.String,
  is_admin: Schema.Boolean,
  PersonStatus: Schema.String,
  ProfilePictureUrl: Schema.String,
})
export type WarpPerson = typeof WarpPerson.Type

export const WarpEntryCreated = Schema.Struct({
  EntryId: Schema.Number,
})

const WarpEntryPerson = Schema.Struct({ PersonId: WarpPersonId })

const WarpEntryTask = Schema.Struct({
  TaskId: Schema.optional(Schema.NullOr(WarpTaskId)),
  TaskName: Schema.optional(Schema.NullOr(Schema.String)),
  Activity: Schema.optional(Schema.NullOr(Schema.String)),
})

const WarpEntryGroup = Schema.Struct({
  GroupName: Schema.optional(Schema.NullOr(Schema.String)),
})

/** Warp's entry listing, mirrored verbatim including its inconsistent casing.
 * Nearly everything is nullable because the list spans the whole company and
 * old rows predate fields that are mandatory today. */
export const WarpEntry = Schema.Struct({
  EntryId: Schema.Number,
  Spent_date: Schema.String,
  hours: Schema.Number,
  Notes: Schema.optional(Schema.NullOr(Schema.String)),
  overtime: Schema.optional(Schema.NullOr(Schema.Boolean)),
  Person: Schema.optional(Schema.NullOr(WarpEntryPerson)),
  Task: Schema.optional(Schema.NullOr(WarpEntryTask)),
  Group: Schema.optional(Schema.NullOr(WarpEntryGroup)),
})
export type WarpEntry = typeof WarpEntry.Type

/** One of the user's own timesheet entries as the Timesheet screen shows it,
 * whoever wrote it: Timekeeper, the Warp UI, or anything else. */
export const SheetEntry = Schema.Struct({
  entryId: Schema.Number,
  date: Schema.String,
  hours: Schema.Number,
  overtime: Schema.Boolean,
  description: Schema.String,
  taskId: Schema.Number,
  projectName: Schema.String,
  clientName: Schema.String,
  activity: Schema.String,
})
export type SheetEntry = typeof SheetEntry.Type

export const toSheetEntry = (entry: WarpEntry): SheetEntry => ({
  entryId: entry.EntryId,
  date: entry.Spent_date.slice(0, 10),
  hours: entry.hours,
  overtime: entry.overtime === true,
  description: entry.Notes ?? '',
  taskId: entry.Task?.TaskId ?? 0,
  projectName: entry.Task?.TaskName ?? 'Unknown',
  clientName: entry.Group?.GroupName ?? 'Unknown',
  activity: entry.Task?.Activity ?? 'Unknown',
})

export const SheetEntryRange = Schema.Struct({
  from: Schema.String,
  to: Schema.String,
  entries: Schema.Array(SheetEntry),
  totalHours: Schema.Number,
  overtimeHours: Schema.Number,
  /** The last date actually scanned. Warp pages over every person's entries, so
   * a wide window can run out of budget before reaching `to`. */
  coveredThrough: Schema.String,
  complete: Schema.Boolean,
})
export type SheetEntryRange = typeof SheetEntryRange.Type

/** What the setup flow shows when picking a project to bill against. */
export const SheetProject = Schema.Struct({
  taskId: WarpTaskId,
  name: Schema.String,
  clientName: Schema.String,
  isActive: Schema.Boolean,
})
export type SheetProject = typeof SheetProject.Type

export const toSheetProject = (project: WarpProject): SheetProject => ({
  taskId: project.TaskId,
  name: project.Name,
  clientName: project.Client.Name,
  isActive: project.IsActive,
})
