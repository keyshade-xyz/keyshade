import { z } from 'zod'
import {
  GetSelfResponseSchema,
  UpdateSelfRequestSchema,
  UpdateSelfResponseSchema,
  DeleteSelfRequestSchema,
  DeleteSelfResponseSchema,
  ValidateEmailChangeOTPRequestSchema,
  ValidateEmailChangeOTPResponseSchema,
  ResendEmailChangeOTPRequestSchema,
  ResendEmailChangeOTPResponseSchema
} from './user'

export type GetSelfResponse = z.infer<typeof GetSelfResponseSchema>

export type UpdateSelfRequest = z.infer<typeof UpdateSelfRequestSchema>

export type UpdateSelfResponse = z.infer<typeof UpdateSelfResponseSchema>

export type DeleteSelfRequest = z.infer<typeof DeleteSelfRequestSchema>

export type DeleteSelfResponse = z.infer<typeof DeleteSelfResponseSchema>

export type ValidateEmailChangeOTPRequest = z.infer<
  typeof ValidateEmailChangeOTPRequestSchema
>

export type ValidateEmailChangeOTPResponse = z.infer<
  typeof ValidateEmailChangeOTPResponseSchema
>

export type ResendEmailChangeOTPRequest = z.infer<
  typeof ResendEmailChangeOTPRequestSchema
>

export type ResendEmailChangeOTPResponse = z.infer<
  typeof ResendEmailChangeOTPResponseSchema
>
