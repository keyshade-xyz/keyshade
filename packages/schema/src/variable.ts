import { z } from 'zod'

export const CreateVariableSchema = z.object({
  name: z.string(),
  note: z.string().optional(),
  entries: z.array(
    z.object({
      environmentId: z.string(),
      value: z.string()
    })
  )
})

export const UpdateVariableSchema = CreateVariableSchema.partial()
