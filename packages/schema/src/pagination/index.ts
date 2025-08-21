import { z } from 'zod'

export const PageRequestSchema = z.object({
  page: z.coerce.number().nonnegative().optional(),
  limit: z.coerce.number().nonnegative().optional(),
  sort: z.string().optional(),
  order: z.string().optional(),
  search: z.string().optional()
})

const isUrl = (str: string) => URL.canParse(str, 'thismessage:/')

export const PageResponseSchema = <T>(itemSchema: z.ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    metadata: z
      .object({
        page: z.number(),
        perPage: z.number(),
        pageCount: z.number(),
        totalCount: z.number(),
        links: z.object({
          self: z.string().refine(isUrl),
          first: z.string().refine(isUrl),
          previous: z.string().refine(isUrl).nullable(),
          next: z.string().refine(isUrl).nullable(),
          last: z.string().refine(isUrl)
        })
      })
      .partial()
  })

export const ResponseErrorSchema = z.object({
  message: z.string(),
  error: z.string(),
  statusCode: z.number()
})

export const ClientResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z
    .object({
      success: z.boolean(),
      error: ResponseErrorSchema.nullable(),
      data: dataSchema.nullable()
    })
    .refine((obj) =>
      obj.success
        ? obj.data !== null && obj.error == null
        : obj.data == null && obj.error !== null
    )
