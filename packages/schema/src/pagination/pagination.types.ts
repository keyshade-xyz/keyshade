import { z } from 'zod'
import {
  ClientResponseSchema,
  PageRequestSchema,
  PageResponseSchema,
  ResponseErrorSchema
} from './pagination'

export type PageRequest = z.infer<typeof PageRequestSchema>

export type PageResponse<T> = z.infer<ReturnType<typeof PageResponseSchema<T>>>

export type ResponseError = z.infer<typeof ResponseErrorSchema>

export type ClientResponse<T> = z.infer<
  ReturnType<typeof ClientResponseSchema<T>>
>
