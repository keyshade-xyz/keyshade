import { z } from 'zod'

export const ResendOTPRequestSchema = z.object({
  userEmail: z.string().email()
})

export const ResendOTPResponseSchema = z.void()
