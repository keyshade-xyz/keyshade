import {
  eventSourceEnum,
  eventSeverityEnum,
  eventTriggererEnum,
  eventTypeEnum
} from '@/enums'
import { EnvironmentSchema } from '@/environment'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { BaseProjectSchema } from '@/project'
import { SecretSchema } from '@/secret'
import { VariableSchema } from '@/variable'
import { WorkspaceSchema } from '@/workspace'
import { z } from 'zod'

export const GetEventsRequestSchema = PageRequestSchema.extend({
  workspaceSlug: WorkspaceSchema.shape.slug,
  source: eventSourceEnum.optional(),
  severity: eventSeverityEnum.optional()
})

export const GetEventsResponseSchema = PageResponseSchema(
  z.object({
    id: z.string(),
    source: eventSourceEnum,
    triggerer: eventTriggererEnum,
    severity: eventSeverityEnum,
    type: eventTypeEnum,
    timestamp: z.string().datetime(),
    metadata: z.object({
      name: z.string(),
      projectName: BaseProjectSchema.shape.name,
      projectId: BaseProjectSchema.shape.id.optional(),
      variableId: VariableSchema.shape.id.optional(),
      environmentId: EnvironmentSchema.shape.id.optional(),
      secretId: SecretSchema.shape.id.optional(),
      workspaceId: WorkspaceSchema.shape.id.optional(),
      workspaceName: WorkspaceSchema.shape.name.optional()
    }),
    title: z.string(),
    description: z.string(),
    itemId: z.string(),
    userId: z.string(),
    workspaceId: WorkspaceSchema.shape.id
  })
)
