import { UserSchema } from '@/user'
import { z } from 'zod'
import { WorkspaceSchema } from '@/workspace'
import {
  EmailAlphaNumericStringSchema,
  IPAddressAlphaNumericStringSchema,
  EncryptedDeviceDataSchema,
  OSAlphaNumericStringSchema,
  AgentAlphaNumericStringSchema,
  CityAlphaNumericStringSchema,
  CountryAlphaNumericStringSchema,
  RegionAlphaNumericStringSchema,
  OTPAlphaNumericStringSchema
} from '@/alphanumeric'

export const DeviceDetailSchema = z.object({
  ipAddress: IPAddressAlphaNumericStringSchema,
  encryptedIpAddress: EncryptedDeviceDataSchema,
  os: OSAlphaNumericStringSchema,
  agent: AgentAlphaNumericStringSchema,
  city: CityAlphaNumericStringSchema,
  country: CountryAlphaNumericStringSchema,
  region: RegionAlphaNumericStringSchema
})

export const ResendOTPRequestSchema = z.object({
  userEmail: EmailAlphaNumericStringSchema
})

export const ResendOTPResponseSchema = z.void()

export const ValidateOTPRequestSchema = z.object({
  email: EmailAlphaNumericStringSchema, // purpose: make the email attribute of object sent to alphanumeric schema
  otp: OTPAlphaNumericStringSchema,
  mode: z.enum(['cli']).optional(),
  os: OSAlphaNumericStringSchema,
  agent: AgentAlphaNumericStringSchema
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
  agent: AgentAlphaNumericStringSchema
})

export const SendOTPResponseSchema = z.void()

export const LogOutRequestSchema = z.void()

export const LogOutResponseSchema = z.void()
