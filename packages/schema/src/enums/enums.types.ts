import {
  eventTypeEnum,
  expiresAfterEnum,
  integrationTypeEnum,
  rotateAfterEnum
} from './enums'
import { z } from 'zod'

export type IntegrationType = z.infer<typeof integrationTypeEnum>
export type ExpiresAfter = z.infer<typeof expiresAfterEnum>
export type RotateAfter = z.infer<typeof rotateAfterEnum>
export type EventType = z.infer<typeof eventTypeEnum>
