import { z } from 'zod'

export const PageRequestSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  order: z.string().optional(),
  search: z.string().optional()
})
export type PageRequest = z.infer<typeof PageRequestSchema>

export const PageResponseSchema = <T>(itemSchema: z.ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    metadata: z.object({
      page: z.number(),
      perPage: z.number(),
      pageCount: z.number(),
      totalCount: z.number(),
      links: z.object({
        self: z.string(),
        first: z.string(),
        previous: z.string().nullable(),
        next: z.string().nullable(),
        last: z.string()
      })
    })
  })
export type PageResponse<T> = z.infer<ReturnType<typeof PageResponseSchema<T>>>

export const ResponseErrorSchema = z.object({
  message: z.string(),
  error: z.string(),
  statusCode: z.number()
})
export type ResponseError = z.infer<typeof ResponseErrorSchema>

export const ClientResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    error: ResponseErrorSchema.nullable(),
    data: dataSchema.nullable()
  })
export type ClientResponse<T> = z.infer<
  ReturnType<typeof ClientResponseSchema<T>>
>

//Export Other Schemas
export * from './api-key'
export * from './environment'
export * from './integration'
export * from './project'
export * from './secret'
export * from './variable'

export * from './workspace/workspace'
export * from './workspace/workspace.types'

export * from './workspace-role'
export * from './enums'
