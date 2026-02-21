import { UserSchema } from '@/user'
import { z } from 'zod'
import { WorkspaceSchema } from '@/workspace'
import {
  EmailAlphaNumericStringSchema,
  ipAddressAlphaNumericStringSchema,
  EncryptedDeviceDataSchema,
  OSAlphaNumericStringSchema,
  agentAlphaNumericStringSchema,
  cityAlphaNumericStringSchema,
  countryAlphaNumericStringSchema,
  regionAlphaNumericStringSchema
} from '@/alphanumeric'

export const DeviceDetailSchema = z.object({
  ipAddress: ipAddressAlphaNumericStringSchema,
  encryptedIpAddress: EncryptedDeviceDataSchema,
  os: OSAlphaNumericStringSchema,
  agent: agentAlphaNumericStringSchema,
  city: cityAlphaNumericStringSchema,
  country: countryAlphaNumericStringSchema,
  region: regionAlphaNumericStringSchema
})

export const ResendOTPRequestSchema = z.object({
  userEmail: EmailAlphaNumericStringSchema
})

export const ResendOTPResponseSchema = z.void()

export const ValidateOTPRequestSchema = z.object({
  email: EmailAlphaNumericStringSchema, // purpose: make the email attribute of object sent to alphanumeric schema
  otp: z.string().length(6),
  mode: z.enum(['cli']).optional(),
  os: OSAlphaNumericStringSchema,
  agent: agentAlphaNumericStringSchema
})

export const ValidateOTPResponseSchema = UserSchema.extend({
  token: z.string().optional(),
  cliSessionId: z.string().optional(),
  defaultWorkspace: WorkspaceSchema
})

export const SendOTPRequestSchema = z.object({
  email: EmailAlphaNumericStringSchema, // purpose: make the email attribute of object sent to alphanumeric schema
  mode: z.enum(['cli']).optional(),
  os: OSAlphaNumericStringSchema,
  agent: agentAlphaNumericStringSchema
})

export const SendOTPResponseSchema = z.void()

export const LogOutRequestSchema = z.void()

export const LogOutResponseSchema = z.void()
