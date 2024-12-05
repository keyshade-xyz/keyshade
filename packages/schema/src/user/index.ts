import { z } from 'zod'
import { WorkspaceSchema } from '@/workspace'

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  profilePictureUrl: z.string().nullable(),
  isActive: z.boolean(),
  isOnboardingFinished: z.boolean(),
  isAdmin: z.boolean(),
  authProvider: z.string()
})

export const GetSelfResponseSchema = UserSchema.extend({
  defaultWorkspace: WorkspaceSchema
})

export const UpdateSelfRequestSchema = z.object({
  name: z.string().optional(),
  profilePictureUrl: z.string().optional(),
  isOnboardingFinished: z.boolean().optional(),
  email: z.string().email().optional()
})

export const UpdateSelfResponseSchema = UserSchema

export const DeleteSelfRequestSchema = z.void()

export const DeleteSelfResponseSchema = z.void()

export const ValidateEmailChangeOTPRequestSchema = z.object({
  otp: z.string().min(6).max(6)
})

export const ValidateEmailChangeOTPResponseSchema = UserSchema

export const ResendEmailChangeOTPRequestSchema = z.void()

export const ResendEmailChangeOTPResponseSchema = z.void()
