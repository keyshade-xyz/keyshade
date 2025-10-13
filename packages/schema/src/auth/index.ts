import { UserSchema } from '@/user'
import { z } from 'zod'
import { WorkspaceSchema } from '@/workspace'

export const DeviceDetailSchema = z.object({
  ipAddress: z.string().ip().optional(),
  encryptedIpAddress: z.string(),
  os: z.string().optional(),
  agent: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional()
})

export const ResendOTPRequestSchema = z.object({
  userEmail: z.string().email()
})

export const ResendOTPResponseSchema = z.void()

export const ValidateOTPRequestSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  mode: z.enum(['cli']).optional(),
  os: z.string().optional(),
  agent: z.string().optional()
})

export const ValidateOTPResponseSchema = UserSchema.extend({
  token: z.string().optional(),
  cliSessionId: z.string().optional(),
  defaultWorkspace: WorkspaceSchema
})

export const SendOTPRequestSchema = z.object({
  email: z.string().email(),
  mode: z.enum(['cli']).optional(),
  os: z.string().optional(),
  agent: z.string().optional()
})

export const SendOTPResponseSchema = z.void()

export const LogOutRequestSchema = z.void()

export const LogOutResponseSchema = z.void()
