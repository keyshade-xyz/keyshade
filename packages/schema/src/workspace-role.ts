import { z } from 'zod'
import { authorityEnum } from '@/enums'

export const CreateWorkspaceRoleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  colorCode: z.string().optional(),
  authorities: z.array(authorityEnum).optional(),
  projectIds: z.array(z.string()).optional()
})

export const UpdateWorkspaceRoleSchema = CreateWorkspaceRoleSchema.partial()
