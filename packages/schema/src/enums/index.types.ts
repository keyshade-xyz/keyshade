import { z } from 'zod'
import {
  authorityEnum,
  eventSeverityEnum,
  eventSourceEnum,
  eventTriggererEnum,
  eventTypeEnum,
  expiresAfterEnum,
  integrationTypeEnum,
  projectAccessLevelEnum,
  rotateAfterEnum
} from '.'

export type AuthorityEnum = z.infer<typeof authorityEnum>

export type ProjectAccessLevelEnum = z.infer<typeof projectAccessLevelEnum>

export type EventSeverityEnum = z.infer<typeof eventSeverityEnum>

export type EventTypeEnum = z.infer<typeof eventTypeEnum>

export type EventTriggererEnum = z.infer<typeof eventTriggererEnum>

export type EventSourceEnum = z.infer<typeof eventSourceEnum>

export type RotateAfterEnum = z.infer<typeof rotateAfterEnum>

export type ExpiresAfterEnum = z.infer<typeof expiresAfterEnum>

export type IntegrationTypeEnum = z.infer<typeof integrationTypeEnum>
