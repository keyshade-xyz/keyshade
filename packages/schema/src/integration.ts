import { z } from 'zod'
import { eventTypeEnum, integrationTypeEnum } from '@/enums/enums'

export const CreateIntegrationSchema = z.object({
  name: z.string(),
  type: integrationTypeEnum,
  metadata: z.record(z.string(), z.any()),
  notifyOn: z.array(eventTypeEnum).optional(),
  environmentId: z.string().optional(),
  projectId: z.string().optional()
})

export const UpdateIntegrationSchema = CreateIntegrationSchema.partial()
