import { z } from 'zod'

export const PersonalAccessTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  expiresOn: z.string().datetime().nullable(),
  lastUsedOn: z.string().datetime().nullable()
})

export const CreatePersonalAccessTokenRequest = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  expiresAfterDays: z.number().min(0).max(365).nullable()
})

export const CreatePersonalAccessTokenResponse =
  PersonalAccessTokenSchema.extend({
    token: z.string()
  })

export const UpdatePersonalAccessTokenRequest = z.object({
  tokenId: z.string(),
  name: CreatePersonalAccessTokenRequest.shape.name.nullable(),
  expiresAfterDays:
    CreatePersonalAccessTokenRequest.shape.expiresAfterDays.nullable()
})

export const UpdatePersonalAccessTokenResponse = PersonalAccessTokenSchema

export const RegeneratePersonalAccessTokenRequest = z.object({
  tokenId: z.string()
})

export const RegeneratePersonalAccessTokenResponse =
  PersonalAccessTokenSchema.extend({
    token: z.string()
  })

export const GetAllPersonalAccessTokensRequest = z.void()

export const GetAllPersonalAccessTokensResponse = z.array(
  PersonalAccessTokenSchema
)

export const DeletePersonalAccessTokenRequest = z.object({
  tokenId: z.string()
})

export const DeletePersonalAccessTokenResponse = z.void()
