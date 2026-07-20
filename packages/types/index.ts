import { z } from 'zod'

export const warpProjectSchema = z.object({
  TaskId: z.number(),
  Name: z.string(),
  IsActive: z.boolean(),
  Created_On: z.string(),
  Updated_On: z.string(),
  Client: z.object({
    GroupId: z.number(),
    Name: z.string(),
    Currency: z.string(),
  }),
})

export type WarpProject = z.infer<typeof warpProjectSchema>

export const warpPersonIdSchema = z.object({
  PersonId: z.number(),
  FirstName: z.string(),
  Surname: z.string(),
  Email: z.email(),
  TelephoneNumber: z.string(),
  is_admin: z.boolean(),
  PersonStatus: z.string(),
  CreatedOnUtc: z.string(),
  ModifiedOnUtc: z.string(),
  ProfilePictureUrl: z.string(),
})

export type WarpPersonIdSchema = z.infer<typeof warpPersonIdSchema>

export const jiraProjectSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
})

export enum WarpAuthStatus {
  Authed,
  NoToken,
  Stale, // Has token but is not working on Warp
}

export function toAPIWarpAuthStatus(status: WarpAuthStatus): number {
  switch (status) {
    case WarpAuthStatus.Authed:
      return 0
    case WarpAuthStatus.NoToken:
      return 1
    case WarpAuthStatus.Stale:
      return 2
  }
}

export function toWarpAuthStatus(status: number): WarpAuthStatus {
  switch (status) {
    case 0:
      return WarpAuthStatus.Authed
    case 1:
      return WarpAuthStatus.NoToken
    case 2:
      return WarpAuthStatus.Stale
    default:
      throw new Error(`Unknown Warp auth status: ${status}`)
  }
}

export type JiraProject = z.infer<typeof jiraProjectSchema>

export const jiraIssueSchema = z.object({
  expand: z.string(),
  id: z.string(),
  self: z.string(),
  key: z.string(),
  fields: z.object({
    summary: z.string(),
  }),
})

export type JiraIssue = z.infer<typeof jiraIssueSchema>

export const jiraIssuesResponseSchema = z.object({
  issues: jiraIssueSchema.array(),
  isLast: z.boolean(),
  nextPageToken: z.string().optional(),
})

export const StatusCondition = {
  Entered: 0,
  Stationary: 1,
  Left: 2,
} as const

export type StatusCondition =
  (typeof StatusCondition)[keyof typeof StatusCondition]

export const stubMessages = [
  {
    id: 0,
    text: 'Today I began working on',
  },
  {
    id: 1,
    text: 'Today I continue work on',
  },
  {
    id: 2,
    text: 'Today I opened a pull request for',
  },
  {
    id: 3,
    text: 'Today I completed',
  },
] as const

export type StubMessageID = (typeof stubMessages)[number]['id']

export const boardSheetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sheetTaskId: z.number(),
  sheetName: z.string(),
  sheetClientName: z.string(),
  boardId: z.string(),
  boardName: z.string(),
  boardKey: z.string(),
})

export type BoardSheet = z.infer<typeof boardSheetSchema>

export const warpAuthStatusSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal(toAPIWarpAuthStatus(WarpAuthStatus.Authed)),
    personId: z.number(),
  }),
  z.object({
    status: z.literal(toAPIWarpAuthStatus(WarpAuthStatus.NoToken)),
  }),
  z.object({
    status: z.literal(toAPIWarpAuthStatus(WarpAuthStatus.Stale)),
  }),
])
