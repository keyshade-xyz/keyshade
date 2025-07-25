import { z } from 'zod'
import { WorkspaceSchema } from '@/workspace'
import { authProviderEnum } from '@/enums'

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  profilePictureUrl: z.string().nullable(),
  isActive: z.boolean(),
  isOnboardingFinished: z.boolean(),
  isAdmin: z.boolean(),
  authProvider: authProviderEnum,
  joinedOn: z.coerce.date(),
  referralCode: z.string(),
  referredById: z.string().nullable(),
  emailPreference: z.object({
    marketing: z.boolean(),
    activity: z.boolean(),
    critical: z.boolean()
  })
})

export const GetSelfResponseSchema = UserSchema.extend({
  defaultWorkspace: WorkspaceSchema
})

export const UpdateSelfRequestSchema = z.object({
  name: z.string().optional(),
  profilePictureUrl: z.string().optional(),
  email: z.string().email().optional(),
  emailPreferences: z
    .object({
      marketing: z.boolean().optional(),
      activity: z.boolean().optional(),
      critical: z.boolean().optional()
    })
    .optional()
})

export const UpdateSelfResponseSchema = UserSchema

export const FinishOnboardingRequestSchema = z.object({
  name: z.string(),
  profilePictureUrl: z.string().optional(),
  role: z.string().optional(),
  industry: z.string().optional(),
  teamSize: z.string().optional(),
  productStage: z.string().optional(),
  useCase: z.string().optional(),
  heardFrom: z.string().optional(),
  referralCode: z.string().optional()
})

export const FinishOnboardingResponseSchema = UserSchema

export const DeleteSelfRequestSchema = z.void()

export const DeleteSelfResponseSchema = z.void()

export const ValidateEmailChangeOTPRequestSchema = z.object({
  otp: z.string().min(6).max(6)
})

export const ValidateEmailChangeOTPResponseSchema = UserSchema

export const ResendEmailChangeOTPRequestSchema = z.void()

export const ResendEmailChangeOTPResponseSchema = z.void()
