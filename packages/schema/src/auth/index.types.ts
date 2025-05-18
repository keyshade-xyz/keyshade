import { z } from 'zod'
import {
  LogOutRequestSchema,
  LogOutResponseSchema,
  ResendOTPRequestSchema,
  ResendOTPResponseSchema,
  SendOTPRequestSchema,
  SendOTPResponseSchema,
  ValidateOTPRequestSchema,
  ValidateOTPResponseSchema
} from '.'

export type ResendOTPRequest = z.infer<typeof ResendOTPRequestSchema>

export type ResendOTPResponse = z.infer<typeof ResendOTPResponseSchema>

export type ValidateOTPRequest = z.infer<typeof ValidateOTPRequestSchema>

export type ValidateOTPResponse = z.infer<typeof ValidateOTPResponseSchema>

export type SendOTPRequest = z.infer<typeof SendOTPRequestSchema>

export type SendOTPResponse = z.infer<typeof SendOTPResponseSchema>

export type LogOutRequest = z.infer<typeof LogOutRequestSchema>

export type LogOutResponse = z.infer<typeof LogOutResponseSchema>
