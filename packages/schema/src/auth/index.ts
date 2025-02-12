import { UserSchema } from '@/user'
import { z } from 'zod'

export const ResendOTPRequestSchema = z.object({
  userEmail: z.string().email()
})

export const ResendOTPResponseSchema = z.void()

export const ValidateOTPRequestSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
})

export const ValidateOTPResponseSchema = UserSchema

export const SendOTPRequestSchema = z.object({
  email: z.string().email()
})

export const SendOTPResponseSchema = z.void()
