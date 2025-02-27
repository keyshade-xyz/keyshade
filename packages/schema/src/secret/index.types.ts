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
  GetAllSecretsOfEnvironmentResponseSchema
} from '.'

export type Secret = z.infer<typeof SecretSchema>

export type CreateSecretRequest = z.infer<typeof CreateSecretRequestSchema>

export type CreateSecretResponse = z.infer<typeof CreateSecretResponseSchema>

export type UpdateSecretRequest = z.infer<typeof UpdateSecretRequestSchema>

export type UpdateSecretResponse = z.infer<typeof UpdateSecretResponseSchema>

export type DeleteSecretRequest = z.infer<typeof DeleteSecretRequestSchema>

export type DeleteSecretResponse = z.infer<typeof DeleteSecretResponseSchema>

export type RollBackSecretRequest = z.infer<typeof RollBackSecretRequestSchema>

export type RollBackSecretResponse = z.infer<
  typeof RollBackSecretResponseSchema
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
