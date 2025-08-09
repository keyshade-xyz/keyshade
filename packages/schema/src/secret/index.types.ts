import { z } from 'zod'
import {
  SecretSchema,
  CreateSecretRequestSchema,
  CreateSecretResponseSchema,
  UpdateSecretRequestSchema,
  UpdateSecretResponseSchema,
  DeleteSecretRequestSchema,
  DeleteSecretResponseSchema,
  RollBackSecretRequestSchema,
  RollBackSecretResponseSchema,
  GetAllSecretsOfProjectRequestSchema,
  GetAllSecretsOfProjectResponseSchema,
  GetRevisionsOfSecretRequestSchema,
  GetRevisionsOfSecretResponseSchema,
  GetAllSecretsOfEnvironmentRequestSchema,
  GetAllSecretsOfEnvironmentResponseSchema,
  DeleteEnvironmentValueOfSecretRequestSchema,
  DeleteEnvironmentValueOfSecretResponseSchema,
  SecretRevisionSchema,
  BulkCreateSecretResponseSchema,
  BulkCreateSecretRequestSchema,
  DisableSecretRequestSchema,
  DisableSecretResponseSchema,
  EnableSecretRequestSchema,
  EnableSecretResponseSchema,
  getAllDisabledEnvironmentsOfSecretRequestSchema,
  getAllDisabledEnvironmentsOfSecretResponseSchema
} from '.'

export type Secret = z.infer<typeof SecretSchema>
export type SecretVersion = z.infer<typeof SecretRevisionSchema>

export type CreateSecretRequest = z.infer<typeof CreateSecretRequestSchema>

export type CreateSecretResponse = z.infer<typeof CreateSecretResponseSchema>

export type BulkCreateSecretRequest = z.infer<
  typeof BulkCreateSecretRequestSchema
>

export type BulkCreateSecretResponse = z.infer<
  typeof BulkCreateSecretResponseSchema
>

export type UpdateSecretRequest = z.infer<typeof UpdateSecretRequestSchema>

export type UpdateSecretResponse = z.infer<typeof UpdateSecretResponseSchema>

export type DeleteEnvironmentValueOfSecretRequest = z.infer<
  typeof DeleteEnvironmentValueOfSecretRequestSchema
>

export type DeleteEnvironmentValueOfSecretResponse = z.infer<
  typeof DeleteEnvironmentValueOfSecretResponseSchema
>

export type DeleteSecretRequest = z.infer<typeof DeleteSecretRequestSchema>

export type DeleteSecretResponse = z.infer<typeof DeleteSecretResponseSchema>

export type RollBackSecretRequest = z.infer<typeof RollBackSecretRequestSchema>

export type RollBackSecretResponse = z.infer<
  typeof RollBackSecretResponseSchema
>

export type DisableSecretRequest = z.infer<typeof DisableSecretRequestSchema>

export type DisableSecretResponse = z.infer<typeof DisableSecretResponseSchema>

export type EnableSecretRequest = z.infer<typeof EnableSecretRequestSchema>

export type EnableSecretResponse = z.infer<typeof EnableSecretResponseSchema>

export type GetAllDisabledEnvironmentsOfSecretRequest = z.infer<
  typeof getAllDisabledEnvironmentsOfSecretRequestSchema
>

export type GetAllDisabledEnvironmentsOfSecretResponse = z.infer<
  typeof getAllDisabledEnvironmentsOfSecretResponseSchema
>

export type GetAllSecretsOfProjectRequest = z.infer<
  typeof GetAllSecretsOfProjectRequestSchema
>

export type GetAllSecretsOfProjectResponse = z.infer<
  typeof GetAllSecretsOfProjectResponseSchema
>

export type GetRevisionsOfSecretRequest = z.infer<
  typeof GetRevisionsOfSecretRequestSchema
>

export type GetRevisionsOfSecretResponse = z.infer<
  typeof GetRevisionsOfSecretResponseSchema
>

export type GetAllSecretsOfEnvironmentRequest = z.infer<
  typeof GetAllSecretsOfEnvironmentRequestSchema
>

export type GetAllSecretsOfEnvironmentResponse = z.infer<
  typeof GetAllSecretsOfEnvironmentResponseSchema
>
