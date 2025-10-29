import { z } from 'zod'
import {
  CreatePersonalAccessTokenRequest,
  CreatePersonalAccessTokenResponse,
  DeletePersonalAccessTokenRequest,
  DeletePersonalAccessTokenResponse,
  GetAllPersonalAccessTokensRequest,
  GetAllPersonalAccessTokensResponse,
  PersonalAccessTokenSchema,
  RegeneratePersonalAccessTokenRequest,
  RegeneratePersonalAccessTokenResponse,
  UpdatePersonalAccessTokenRequest,
  UpdatePersonalAccessTokenResponse
} from '@/personal-access-token/index'

export type PersonalAccessToken = z.infer<typeof PersonalAccessTokenSchema>

export type CreatePersonalAccessTokenRequest = z.infer<
  typeof CreatePersonalAccessTokenRequest
>

export type CreatePersonalAccessTokenResponse = z.infer<
  typeof CreatePersonalAccessTokenResponse
>

export type UpdatePersonalAccessTokenRequest = z.infer<
  typeof UpdatePersonalAccessTokenRequest
>

export type UpdatePersonalAccessTokenResponse = z.infer<
  typeof UpdatePersonalAccessTokenResponse
>

export type RegeneratePersonalAccessTokenRequest = z.infer<
  typeof RegeneratePersonalAccessTokenRequest
>

export type RegeneratePersonalAccessTokenResponse = z.infer<
  typeof RegeneratePersonalAccessTokenResponse
>

export type GetAllPersonalAccessTokensRequest = z.infer<
  typeof GetAllPersonalAccessTokensRequest
>

export type GetAllPersonalAccessTokensResponse = z.infer<
  typeof GetAllPersonalAccessTokensResponse
>

export type DeletePersonalAccessTokenRequest = z.infer<
  typeof DeletePersonalAccessTokenRequest
>

export type DeletePersonalAccessTokenResponse = z.infer<
  typeof DeletePersonalAccessTokenResponse
>
