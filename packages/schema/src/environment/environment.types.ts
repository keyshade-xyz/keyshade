import { z } from 'zod'
import {
  EnvironmentSchema,
  CreateEnvironmentRequestSchema,
  CreateEnvironmentResponseSchema,
  UpdateEnvironmentRequestSchema,
  UpdateEnvironmentResponseSchema,
  GetEnvironmentRequestSchema,
  GetEnvironmentResponseSchema,
  GetAllEnvironmentsOfProjectRequestSchema,
  GetAllEnvironmentsOfProjectResponseSchema,
  DeleteEnvironmentRequestSchema,
  DeleteEnvironmentResponseSchema
} from './environment'

export type Environment = z.infer<typeof EnvironmentSchema>

export type CreateEnvironmentRequest = z.infer<
  typeof CreateEnvironmentRequestSchema
>

export type CreateEnvironmentResponse = z.infer<
  typeof CreateEnvironmentResponseSchema
>

export type UpdateEnvironmentRequest = z.infer<
  typeof UpdateEnvironmentRequestSchema
>

export type UpdateEnvironmentResponse = z.infer<
  typeof UpdateEnvironmentResponseSchema
>

export type GetEnvironmentRequest = z.infer<typeof GetEnvironmentRequestSchema>

export type GetEnvironmentResponse = z.infer<
  typeof GetEnvironmentResponseSchema
>

export type GetAllEnvironmentsOfProjectRequest = z.infer<
  typeof GetAllEnvironmentsOfProjectRequestSchema
>

export type GetAllEnvironmentsOfProjectResponse = z.infer<
  typeof GetAllEnvironmentsOfProjectResponseSchema
>

export type DeleteEnvironmentRequest = z.infer<
  typeof DeleteEnvironmentRequestSchema
>

export type DeleteEnvironmentResponse = z.infer<
  typeof DeleteEnvironmentResponseSchema
>
