import { z } from 'zod'
export const ShareSecretRequestSchema = z.object({
  secret: z.string(),
  password: z.string().optional(),
  expiresAfterDays: z.number().min(1).max(365).default(1).optional(),
  viewLimit: z.number().min(1).max(10).default(1).optional()
})

export const ShareSecretResponseSchema = z.object({
  id: z.string(),
  hash: z.string(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  isPasswordProtected: z.boolean()
})

export const emailShareSecretRequestSchema = z.object({
  hash: z.string(),
  email: z.string()
})

export const emailShareSecretResponseSchema = z.void()

export const viewShareSecretRequestSchema = z.object({
  hash: z.string()
})

export const viewShareSecretResponseSchema = z.object({
  id: z.string(),
  hash: z.string(),
  secret: z.string(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  isPasswordProtected: z.boolean()
})
