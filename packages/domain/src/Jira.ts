import { Schema } from 'effect'

export const JiraProjectId = Schema.String.pipe(Schema.brand('JiraProjectId'))
export type JiraProjectId = typeof JiraProjectId.Type

export const JiraStatusId = Schema.String.pipe(Schema.brand('JiraStatusId'))
export type JiraStatusId = typeof JiraStatusId.Type

export const JiraProject = Schema.Struct({
  id: JiraProjectId,
  key: Schema.String,
  name: Schema.String,
})
export type JiraProject = typeof JiraProject.Type

export const JiraIssue = Schema.Struct({
  id: Schema.String,
  key: Schema.String,
  summary: Schema.String,
  status: Schema.optional(Schema.String),
})
export type JiraIssue = typeof JiraIssue.Type

export const JiraStatus = Schema.Struct({
  id: JiraStatusId,
  name: Schema.String,
})
export type JiraStatus = typeof JiraStatus.Type

/** Jira groups statuses under a category (To Do / In Progress / Done) which is
 * how the rule builder presents them. */
export const JiraStatusCategory = Schema.Struct({
  key: Schema.String,
  name: Schema.String,
  colorName: Schema.String,
  statuses: Schema.Array(JiraStatus),
})
export type JiraStatusCategory = typeof JiraStatusCategory.Type
