import { z } from 'zod'
import {
  ApiKeySchema,
  CreateApiKeyRequestSchema,
  CreateApiKeyResponseSchema,
  UpdateApiKeyRequestSchema,
  UpdateApiKeyResponseSchema,
  DeleteApiKeyRequestSchema,
  DeleteApiKeyResponseSchema,
  GetApiKeysOfUserRequestSchema,
  GetApiKeysOfUserResponseSchema,
  GetApiKeyRequestSchema,
  GetApiKeyResponseSchema,
  CanAccessLiveUpdatesApiKeyRequestSchema,
  CanAccessLiveUpdatesApiKeyResponseSchema
} from '.'

export type ApiKey = z.infer<typeof ApiKeySchema>

export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>

export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>

export type UpdateApiKeyRequest = z.infer<typeof UpdateApiKeyRequestSchema>

export type UpdateApiKeyResponse = z.infer<typeof UpdateApiKeyResponseSchema>

export type DeleteApiKeyRequest = z.infer<typeof DeleteApiKeyRequestSchema>

export type DeleteApiKeyResponse = z.infer<typeof DeleteApiKeyResponseSchema>

export type GetApiKeysOfUserRequest = z.infer<
  typeof GetApiKeysOfUserRequestSchema
>

export type GetApiKeysOfUserResponse = z.infer<
  typeof GetApiKeysOfUserResponseSchema
>

export type GetApiKeyRequest = z.infer<typeof GetApiKeyRequestSchema>

export type GetApiKeyResponse = z.infer<typeof GetApiKeyResponseSchema>

export type CanAccessLiveUpdatesApiKeyRequest = z.infer<
  typeof CanAccessLiveUpdatesApiKeyRequestSchema
>

export type CanAccessLiveUpdatesApiKeyResponse = z.infer<
  typeof CanAccessLiveUpdatesApiKeyResponseSchema
>
