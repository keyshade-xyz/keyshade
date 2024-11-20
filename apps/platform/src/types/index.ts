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
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isFreeTier: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  ownerId: z.string(),
  isDefault: z.boolean(),
  lastUpdatedById: z.string().datetime().nullable()
})

export const zProject = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publicKey: z.string(),
  privateKey: z.string(),
  storePrivateKey: z.boolean(),
  isDisabled: z.boolean(),
  accessLevel: z.enum(['GLOBAL', 'INTERNAL', 'PRIVATE']),
  lastUpdatedById: z.string(),
  workspaceId: z.string().uuid(),
  isForked: z.boolean(),
  forkedFromId: z.string().uuid().nullable()
})

export const zEnvironment = z.object({
  name: z.string(),
  projectId: z.string(),
  description: z.string().optional()

  // description: z.string().nullable(),
  // isDefault: z.boolean().optional(),
  
})

export const zNewProject = z.object({
  name: z.string(),
  description: z.string().nullable(),
  storePrivateKey: z.boolean(),
  environments: z.array(zEnvironment),
  accessLevel: z.enum(['GLOBAL', 'INTERNAL', 'PRIVATE'])
})

export const zProjectWithoutKeys = zProject.omit({
  publicKey: true,
  privateKey: true
})

export const zVersion = z.object({
  id: z.string().uuid(),
  value: z.string(),
  version: z.number()
})

export const zSecret = z.object({
  secret: z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    rotateAt: z.string().datetime().nullable(),
    note: z.string().nullable(),
    lastUpdatedById: z.string(),
    projectId: z.string(),
    lastUpdatedBy: z.object({
      id: z.string(),
      name: z.string()
    })
  }),
  values: z.array(
    z.object({
      environment: z.object({
        id: z.string(),
        name: z.string()
      }),
      value: z.string()
    })
  )
})

export type User = z.infer<typeof zUser>
export type Workspace = z.infer<typeof zWorkspace>
export type Project = z.infer<typeof zProject>
export type ProjectWithoutKeys = z.infer<typeof zProjectWithoutKeys>
export type Environment = z.infer<typeof zEnvironment>
export type NewProject = z.infer<typeof zNewProject>
export type Secret = z.infer<typeof zSecret>
