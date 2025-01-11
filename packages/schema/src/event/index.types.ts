import { z } from 'zod'
import { GetEventsRequestSchema, GetEventsResponseSchema } from '.'

export type GetEventsRequest = z.infer<typeof GetEventsRequestSchema>

export type GetEventsResponse = z.infer<typeof GetEventsResponseSchema>
