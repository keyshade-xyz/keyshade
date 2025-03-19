import { z } from 'zod'
import { expiresAfterEnum, authorityEnum } from '@/enums'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'

export const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  preview: z.string(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  authorities: z.array(authorityEnum)
})

export const CreateApiKeyRequestSchema = z.object({
  name: ApiKeySchema.shape.name,
  expiresAfter: expiresAfterEnum.optional(),
  authorities: ApiKeySchema.shape.authorities.optional()
})

export const CreateApiKeyResponseSchema = ApiKeySchema.extend({
  value: z.string(),
  userId: z.string()
})

export const UpdateApiKeyRequestSchema =
  CreateApiKeyRequestSchema.partial().extend({
    apiKeySlug: ApiKeySchema.shape.slug
  })

export const UpdateApiKeyResponseSchema = ApiKeySchema

export const DeleteApiKeyRequestSchema = z.object({
  apiKeySlug: ApiKeySchema.shape.slug
})

export const DeleteApiKeyResponseSchema = z.void()

export const GetApiKeysOfUserRequestSchema = PageRequestSchema

export const GetApiKeysOfUserResponseSchema = PageResponseSchema(ApiKeySchema)

export const GetApiKeyRequestSchema = z.object({
  apiKeySlug: ApiKeySchema.shape.slug
})

export const GetApiKeyResponseSchema = ApiKeySchema

export const CanAccessLiveUpdatesApiKeyRequestSchema = z.void()

export const CanAccessLiveUpdatesApiKeyResponseSchema = z.object({
  canAccessLiveUpdates: z.boolean()
})
