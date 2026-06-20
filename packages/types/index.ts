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

export type WarpProject = typeof warpProjectSchema
