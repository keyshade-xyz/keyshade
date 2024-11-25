import { z } from 'zod'
import { expiresAfterEnum, authorityEnum } from '@/enums'
import { PageRequestSchema } from '@/pagination'

export const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  value: z.string(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  authorities: z.array(authorityEnum),
  userId: z.string()
})

export const CreateApiKeyRequestSchema = z.object({
  name: ApiKeySchema.shape.name,
  expiresAfter: expiresAfterEnum.optional(),
  authorities: ApiKeySchema.shape.authorities.optional()
})

export const CreateApiKeyResponseSchema = ApiKeySchema

export const UpdateApiKeyRequestSchema =
  CreateApiKeyRequestSchema.partial().extend({
    apiKeySlug: ApiKeySchema.shape.slug
  })

export const UpdateApiKeyResponseSchema = ApiKeySchema.omit({
  value: true,
  userId: true
})

export const DeleteApiKeyRequestSchema = z.object({
  apiKeySlug: ApiKeySchema.shape.slug
})

export const DeleteApiKeyResponseSchema = z.void()

export const GetApiKeysOfUserRequestSchema = PageRequestSchema

export const GetApiKeysOfUserResponseSchema = ApiKeySchema.omit({
  value: true,
  userId: true
}).array()

export const GetApiKeyRequestSchema = z.object({
  apiKeySlug: ApiKeySchema.shape.slug
})

export const GetApiKeyResponseSchema = ApiKeySchema.omit({
  value: true,
  userId: true
})

export const CanAccessLiveUpdatesApiKeyRequestSchema = z.void()

export const CanAccessLiveUpdatesApiKeyResponseSchema = z.object({
  canAccessLiveUpdates: z.boolean()
})
