import { z } from 'zod'

export const zUser = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  profilePictureUrl: z.string().url().nullable(),
  isActive: z.boolean(),
  isOnboardingFinished: z.boolean(),
  isAdmin: z.boolean(),
  authProvider: z.string()
})

export const zWorkspace = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isFreeTier: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  ownerId: z.string(),
  approvalEnabled: z.boolean(),
  isDefault: z.boolean(),
  lastUpdatedById: z.string().datetime().nullable()
})

export const zProject = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publicKey: z.string(),
  privateKey: z.string(),
  storePrivateKey: z.boolean(),
  isDisabled: z.boolean(),
  accessLevel: z.enum(['GLOBAL', 'INTERNAL', 'PRIVATE']),
  pendingCreation: z.boolean(),
  lastUpdatedById: z.string(),
  workspaceId: z.string().uuid()
})

export const zEnvironment = z.object({
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean().optional(),
})

export const zNewProject = z.object({
  name: z.string(),
  description: z.string().nullable(),
  storePrivateKey: z.boolean(),
  environments: z.array(zEnvironment)
})

export const zProjectWithoutKeys = zProject.omit({
  publicKey: true,
  privateKey: true
})

export type User = z.infer<typeof zUser>
export type Workspace = z.infer<typeof zWorkspace>
export type Project = z.infer<typeof zProject>
export type ProjectWithoutKeys = z.infer<typeof zProjectWithoutKeys>
export type Environment = z.infer<typeof zEnvironment>
export type NewProject = z.infer<typeof zNewProject>
