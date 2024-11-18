import { z } from 'zod'
import { ResendOTPRequestSchema, ResendOTPResponseSchema } from '.'

export type ResendOTPRequest = z.infer<typeof ResendOTPRequestSchema>

export type ResendOTPResponse = z.infer<typeof ResendOTPResponseSchema>
