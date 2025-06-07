import { z } from 'zod'
import { GetEventsRequestSchema, GetEventsResponseSchema, EventSchema } from '.'

export type Event = z.infer<typeof EventSchema>

export type GetEventsRequest = z.infer<typeof GetEventsRequestSchema>

export type GetEventsResponse = z.infer<typeof GetEventsResponseSchema>
