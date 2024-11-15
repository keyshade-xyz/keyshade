import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination/pagination'
import { CreateEnvironmentSchema } from '@/environment'
import { projectAccessLevelEnum } from '@/enums'

export const ProjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publicKey: z.string(),
    privateKey: z.string(),
    storePrivateKey: z.boolean(),
    isDisabled: z.boolean(),
    accessLevel: z.string(),
    pendingCreation: z.boolean(),
    isForked: z.boolean(),
    lastUpdatedById: z.string(),
    workspaceId: z.string(),
    forkedFromId: z.string().nullable()
  })
  .refine((obj) =>
    obj.isForked ? obj.forkedFromId !== null : obj.forkedFromId === null
  )

export const CreateProjectRequestSchema = z.object({
  name: z.string(),
  workspaceSlug: z.string(),
  description: z.string().optional(),
  storePrivateKey: z.boolean().optional(),
  environments: CreateEnvironmentSchema.array().optional(),
  accessLevel: projectAccessLevelEnum
})

export const CreateProjectResponseSchema = ProjectSchema

export const UpdateProjectRequestSchema = CreateProjectRequestSchema.partial()
  .omit({
    workspaceSlug: true
  })
  .merge(
    z.object({
      projectSlug: z.string(),
      regenerateKeyPair: z.boolean().optional(),
      privateKey: z.string().optional()
    })
  )

export const UpdateProjectResponseSchema = ProjectSchema

export const DeleteProjectRequestSchema = z.object({
  projectSlug: z.string()
})

export const DeleteProjectResponseSchema = z.void()

export const GetProjectRequestSchema = z.object({
  projectSlug: z.string()
})

export const GetProjectResponseSchema = ProjectSchema

export const ForkProjectRequestSchema = z.object({
  projectSlug: z.string(),
  name: z.string().optional(),
  workspaceSlug: z.string().optional(),
  storePrivateKey: z.boolean().optional()
})

export const ForkProjectResponseSchema = ProjectSchema

export const SyncProjectRequestSchema = z.object({
  projectSlug: z.string(),
  hardSync: z.boolean().optional()
})

export const SyncProjectResponseSchema = z.void()

export const UnlinkProjectRequestSchema = z.object({
  projectSlug: z.string()
})

export const UnlinkProjectResponseSchema = z.void()

export const GetForkRequestSchema = PageRequestSchema.extend({
  projectSlug: z.string(),
  workspaceSlug: z.string()
})

export const GetForkResponseSchema = PageResponseSchema(ProjectSchema)

export const GetAllProjectsRequestSchema = PageRequestSchema.extend({
  workspaceSlug: z.string()
})

export const GetAllProjectsResponseSchema = PageResponseSchema(ProjectSchema)
