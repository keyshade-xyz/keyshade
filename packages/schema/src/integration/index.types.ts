import {
  IntegrationSchema,
  CreateIntegrationRequestSchema,
  CreateIntegrationResponseSchema,
  UpdateIntegrationRequestSchema,
  UpdateIntegrationResponseSchema,
  DeleteIntegrationRequestSchema,
  DeleteIntegrationResponseSchema,
  GetIntegrationRequestSchema,
  GetIntegrationResponseSchema,
  GetAllIntegrationRequestSchema,
  GetAllIntegrationResponseSchema
} from '.'
import { z } from 'zod'

export type Integration = z.infer<typeof IntegrationSchema>

export type CreateIntegrationRequest = z.infer<
  typeof CreateIntegrationRequestSchema
>

export type CreateIntegrationResponse = z.infer<
  typeof CreateIntegrationResponseSchema
>

export type UpdateIntegrationRequest = z.infer<
  typeof UpdateIntegrationRequestSchema
>

export type UpdateIntegrationResponse = z.infer<
  typeof UpdateIntegrationResponseSchema
>

export type DeleteIntegrationRequest = z.infer<
  typeof DeleteIntegrationRequestSchema
>

export type DeleteIntegrationResponse = z.infer<
  typeof DeleteIntegrationResponseSchema
>

export type GetIntegrationRequest = z.infer<typeof GetIntegrationRequestSchema>

export type GetIntegrationResponse = z.infer<
  typeof GetIntegrationResponseSchema
>

export type GetAllIntegrationRequest = z.infer<
  typeof GetAllIntegrationRequestSchema
>

export type GetAllIntegrationResponse = z.infer<
  typeof GetAllIntegrationResponseSchema
>
