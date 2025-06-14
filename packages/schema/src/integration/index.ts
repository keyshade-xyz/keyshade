import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import {
  eventTypeEnum,
  integrationRunStatusEnum,
  integrationTypeEnum
} from '@/enums'
import { WorkspaceSchema } from '@/workspace'
import { BaseProjectSchema } from '@/project'
import { EnvironmentSchema } from '@/environment'
import { EventSchema } from '@/event'

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
  project: z
    .object({
      id: BaseProjectSchema.shape.id,
      name: BaseProjectSchema.shape.name,
      slug: BaseProjectSchema.shape.slug
    })
    .nullable(),
  environment: z
    .object({
      id: EnvironmentSchema.shape.id,
      name: EnvironmentSchema.shape.name,
      slug: EnvironmentSchema.shape.slug
    })
    .nullable(),
  workspace: WorkspaceSchema,
  lastUpdatedBy: z.object({
    id: z.string(),
    name: z.string(),
    profilePictureUrl: z.string().nullable()
  })
})

export const IntegrationRunSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.number(),
  triggeredAt: z.string().datetime(),
  logs: z.string().optional(),
  status: integrationRunStatusEnum,
  event: EventSchema,
  eventId: EventSchema.shape.id,
  integrationId: IntegrationSchema.shape.id
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

export const GetAllIntegrationRunsRequestSchema = PageRequestSchema.extend({
  integrationSlug: IntegrationSchema.shape.slug
})

export const GetAllIntegrationRunsResponseSchema =
  PageResponseSchema(IntegrationRunSchema)
