import { z } from 'zod'

export const CreateWorkspaceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  isDefault: z.boolean().optional()
})

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial()

export const InviteMemberSchema = z.object({
  email: z.string(),
  roleIds: z.array(z.string()).optional()
})
