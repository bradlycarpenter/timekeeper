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

export const jiraProjectSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
})

export type JiraProject = z.infer<typeof jiraProjectSchema>

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
