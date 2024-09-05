import z from 'zod'
import { expiresAfterEnum } from './enums'

export const CreateApiKeySchema = z.object({
  name: z.string(),
  expiresAfter: expiresAfterEnum.optional(),
  authorities: z.array(z.string()).optional()
})

export const UpdateApiKeySchema = CreateApiKeySchema.partial()
