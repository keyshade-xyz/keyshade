import { z } from 'zod'
import { rotateAfterEnum } from './enums'

export const CreateSecretSchema = z.object({
  name: z.string(),
  note: z.string().optional(),
  rotateAfter: rotateAfterEnum.optional(),
  entries: z.array(
    z.object({
      environmentId: z.string(),
      value: z.string()
    })
  )
})

export const UpdateSecretSchema = CreateSecretSchema.partial()
