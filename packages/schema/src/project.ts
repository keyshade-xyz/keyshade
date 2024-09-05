import { z } from 'zod'
import { projectAccessLevelEnum } from './enums'
import { CreateEnvironmentSchema } from './environment'

export const CreateProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  storePrivateKey: z.boolean().optional(),
  accessLevel: projectAccessLevelEnum,
  environments: z.array(CreateEnvironmentSchema).optional()
})

export const UpdateProjectSchema = CreateProjectSchema.partial()

export const ForkProjectSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().optional(),
  storePrivateKey: z.boolean().optional()
})
