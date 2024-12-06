import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { eventTypeEnum, integrationTypeEnum } from '@/enums'
import { WorkspaceSchema } from '@/workspace'
import { BaseProjectSchema } from '@/project'
import { EnvironmentSchema } from '@/environment'

export const IntegrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  metadata: z.record(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  type: integrationTypeEnum,
  notifyOn: z.array(eventTypeEnum),
  workspaceId: WorkspaceSchema.shape.id,
  projectId: BaseProjectSchema.shape.id.nullable(),
  environmentId: EnvironmentSchema.shape.id.nullable()
})

export const CreateIntegrationRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  projectSlug: BaseProjectSchema.shape.slug.optional(),
  name: z.string(),
  type: IntegrationSchema.shape.type,
  notifyOn: IntegrationSchema.shape.notifyOn.min(1).optional(),
  metadata: z.record(z.string()),
  environmentSlug: EnvironmentSchema.shape.slug.optional()
})

export const CreateIntegrationResponseSchema = IntegrationSchema

export const UpdateIntegrationRequestSchema =
  CreateIntegrationRequestSchema.partial()
    .omit({
      workspaceSlug: true
    })
    .extend({
      integrationSlug: IntegrationSchema.shape.slug
    })

export const UpdateIntegrationResponseSchema = IntegrationSchema

export const DeleteIntegrationRequestSchema = z.object({
  integrationSlug: IntegrationSchema.shape.slug
})

export const DeleteIntegrationResponseSchema = z.void()

export const GetIntegrationRequestSchema = z.object({
  integrationSlug: IntegrationSchema.shape.slug
})

export const GetIntegrationResponseSchema = IntegrationSchema.extend({
  workspace: WorkspaceSchema
})

export const GetAllIntegrationRequestSchema = PageRequestSchema.extend({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const GetAllIntegrationResponseSchema =
  PageResponseSchema(IntegrationSchema)
