import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { CreateEnvironmentRequestSchema } from '@/environment'
import { projectAccessLevelEnum } from '@/enums'
import { WorkspaceSchema } from '@/workspace'

export const BaseProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publicKey: z.string(),
  privateKey: z.string(),
  storePrivateKey: z.boolean(),
  isDisabled: z.boolean(),
  accessLevel: projectAccessLevelEnum,
  pendingCreation: z.boolean(),
  isForked: z.boolean(),
  lastUpdatedById: z.string(),
  lastUpdateBy: z.object({
    id: z.string(),
    name: z.string(),
    profilePictureUrl: z.string().nullable()
  }),
  workspaceId: WorkspaceSchema.shape.id,
  forkedFromId: z.string().nullable()
})

const EnvironmentSecretAndVariableCountSchema = z.object({
  secretCount: z.number(),
  variableCount: z.number(),
  environmentCount: z.number()
})

export const ProjectSchema = BaseProjectSchema.refine((obj) =>
  obj.isForked ? obj.forkedFromId !== null : obj.forkedFromId === null
)

export const ProjectWithCountSchema = ProjectSchema.and(
  EnvironmentSecretAndVariableCountSchema
)

export const ProjectWithTierLimitAndCountSchema = ProjectWithCountSchema.and(
  z.object({
    maxAllowedEnvironments: z.number(),
    maxAllowedSecrets: z.number(),
    maxAllowedVariables: z.number(),
    totalEnvironments: z.number(),
    totalSecrets: z.number(),
    totalVariables: z.number()
  })
)

export const CreateProjectRequestSchema = z.object({
  name: z.string(),
  workspaceSlug: WorkspaceSchema.shape.slug,
  description: z.string().optional(),
  storePrivateKey: z.boolean().optional(),
  environments: CreateEnvironmentRequestSchema.omit({ projectSlug: true })
    .array()
    .optional(),
  accessLevel: projectAccessLevelEnum
})

export const CreateProjectResponseSchema = ProjectWithTierLimitAndCountSchema

export const UpdateProjectRequestSchema = CreateProjectRequestSchema.partial()
  .omit({
    workspaceSlug: true
  })
  .merge(
    z.object({
      projectSlug: BaseProjectSchema.shape.slug,
      regenerateKeyPair: z.boolean().optional(),
      privateKey: BaseProjectSchema.shape.privateKey.optional()
    })
  )

export const UpdateProjectResponseSchema = ProjectSchema

export const DeleteProjectRequestSchema = z.object({
  projectSlug: BaseProjectSchema.shape.slug
})

export const DeleteProjectResponseSchema = z.void()

export const GetProjectRequestSchema = z.object({
  projectSlug: BaseProjectSchema.shape.slug
})

export const GetProjectResponseSchema = ProjectWithTierLimitAndCountSchema

export const ForkProjectRequestSchema = z.object({
  projectSlug: BaseProjectSchema.shape.slug,
  name: BaseProjectSchema.shape.name.optional(),
  workspaceSlug: WorkspaceSchema.shape.slug.optional(),
  storePrivateKey: BaseProjectSchema.shape.storePrivateKey.optional()
})

export const ForkProjectResponseSchema = ProjectSchema

export const SyncProjectRequestSchema = z.object({
  projectSlug: BaseProjectSchema.shape.slug,
  hardSync: z.boolean().optional()
})

export const SyncProjectResponseSchema = z.void()

export const UnlinkProjectRequestSchema = z.object({
  projectSlug: BaseProjectSchema.shape.slug
})

export const UnlinkProjectResponseSchema = z.void()

export const GetForkRequestSchema = PageRequestSchema.extend({
  projectSlug: BaseProjectSchema.shape.slug
})

export const GetForkResponseSchema = PageResponseSchema(ProjectSchema)

export const GetAllProjectsRequestSchema = PageRequestSchema.extend({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const GetAllProjectsResponseSchema = PageResponseSchema(
  ProjectWithTierLimitAndCountSchema
)
