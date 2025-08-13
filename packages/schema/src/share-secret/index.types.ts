import z from 'zod'
import {
  ShareSecretRequestSchema,
  ShareSecretResponseSchema,
  emailShareSecretRequestSchema,
  emailShareSecretResponseSchema,
  viewShareSecretRequestSchema,
  viewShareSecretResponseSchema
} from '.'

export type ShareSecretRequest = z.infer<typeof ShareSecretRequestSchema>
export type ShareSecretResponse = z.infer<typeof ShareSecretResponseSchema>
export type EmailShareSecretRequest = z.infer<
  typeof emailShareSecretRequestSchema
>
export type EmailShareSecretResponse = z.infer<
  typeof emailShareSecretResponseSchema
>
export type ViewShareSecretRequest = z.infer<
  typeof viewShareSecretRequestSchema
>
export type ViewShareSecretResponse = z.infer<
  typeof viewShareSecretResponseSchema
>
