import {
  eventSourceEnum,
  eventSeverityEnum,
  eventTriggererEnum,
  eventTypeEnum
} from '@/enums'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { z } from 'zod'

export const GetEventsRequestSchema = PageRequestSchema.extend({
  workspaceSlug: z.string(),
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
    timestamp: z.string(),
    metadata: z.object({
      name: z.string(),
      projectName: z.string(),
      projectId: z.string().optional(),
      variableId: z.string().optional(),
      environmentId: z.string().optional(),
      secretId: z.string().optional(),
      workspaceId: z.string().optional(),
      workspaceName: z.string().optional()
    }),
    title: z.string(),
    description: z.string(),
    itemId: z.string(),
    userId: z.string(),
    workspaceId: z.string()
  })
)
