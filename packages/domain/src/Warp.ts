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
