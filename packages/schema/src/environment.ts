import { z } from 'zod'

export const CreateEnvironmentSchema = z.object({
  name: z.string(),
  description: z.string().optional()
})

export const UpdateEnvironmentSchema = CreateEnvironmentSchema.partial()
