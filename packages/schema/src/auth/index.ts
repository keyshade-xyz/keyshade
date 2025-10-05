import { UserSchema } from '@/user'
import { z } from 'zod'
import { WorkspaceSchema } from '@/workspace'

export const ResendOTPRequestSchema = z.object({
  userEmail: z.string().email()
})

export const ResendOTPResponseSchema = z.void()

export const ValidateOTPRequestSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
})

export const ValidateOTPResponseSchema = UserSchema.extend({
  token: z.string().optional(),
  cliSessionId: z.string().optional(),
  defaultWorkspace: WorkspaceSchema
})

export const SendOTPRequestSchema = z.object({
  email: z.string().email()
})

export const SendOTPResponseSchema = z.void()

export const LogOutRequestSchema = z.void()

export const LogOutResponseSchema = z.void()
