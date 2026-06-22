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
