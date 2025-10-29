import { z } from 'zod'
import { DeviceDetailSchema } from '@/auth'

export const CliSessionSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastUsedOn: z.string().datetime().nullable(),
  deviceDetail: DeviceDetailSchema
})

export const BrowserSessionSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastUsedOn: z.string().datetime().nullable(),
  deviceDetail: DeviceDetailSchema
})

export const GetAllCliSessionsRequestSchema = z.void()

export const GetAllCliSessionsResponseSchema = z.array(CliSessionSchema)

export const RevokeCliSessionRequestSchema = z.object({
  sessionId: z.string()
})

export const RevokeCliSessionResponseSchema = z.void()

export const GetAllBrowserSessionsRequestSchema = z.void()

export const GetAllBrowserSessionsResponseSchema = z.array(BrowserSessionSchema)

export const RevokeBrowserSessionRequestSchema = z.object({
  sessionId: z.string()
})

export const RevokeBrowserSessionResponseSchema = z.void()
