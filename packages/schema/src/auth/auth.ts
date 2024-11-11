import { z } from 'zod'

export const ResendOTPRequestSchema = z.object({ userEmail: z.string() })

export const ResendOTPResponseSchema = z.void()
