import { z } from 'zod'
import {
  BrowserSessionSchema,
  CliSessionSchema,
  GetAllBrowserSessionsRequestSchema,
  GetAllBrowserSessionsResponseSchema,
  GetAllCliSessionsRequestSchema,
  GetAllCliSessionsResponseSchema,
  RevokeBrowserSessionRequestSchema,
  RevokeBrowserSessionResponseSchema,
  RevokeCliSessionRequestSchema,
  RevokeCliSessionResponseSchema
} from '@/session/index'

export type CliSession = z.infer<typeof CliSessionSchema>

export type BrowserSession = z.infer<typeof BrowserSessionSchema>

export type GetAllCliSessionsRequest = z.infer<
  typeof GetAllCliSessionsRequestSchema
>

export type GetAllCliSessionsResponse = z.infer<
  typeof GetAllCliSessionsResponseSchema
>

export type RevokeCliSessionRequest = z.infer<
  typeof RevokeCliSessionRequestSchema
>

export type RevokeCliSessionResponse = z.infer<
  typeof RevokeCliSessionResponseSchema
>

export type GetAllBrowserSessionsRequest = z.infer<
  typeof GetAllBrowserSessionsRequestSchema
>

export type GetAllBrowserSessionsResponse = z.infer<
  typeof GetAllBrowserSessionsResponseSchema
>

export type RevokeBrowserSessionRequest = z.infer<
  typeof RevokeBrowserSessionRequestSchema
>

export type RevokeBrowserSessionResponse = z.infer<
  typeof RevokeBrowserSessionResponseSchema
>
