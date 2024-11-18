import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination/pagination'

export const EnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastUpdatedById: z.string(),
  projectId: z.string()
})

export const CreateEnvironmentRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string()
})

export const CreateEnvironmentResponseSchema = EnvironmentSchema

export const UpdateEnvironmentRequestSchema =
  CreateEnvironmentRequestSchema.omit({ projectId: true })
    .partial()
    .extend({ slug: z.string() })

export const UpdateEnvironmentResponseSchema = EnvironmentSchema

export const GetEnvironmentRequestSchema = z.object({
  slug: z.string()
})

export const GetEnvironmentResponseSchema = EnvironmentSchema

export const GetAllEnvironmentsOfProjectRequestSchema =
  PageRequestSchema.extend({
    projectSlug: z.string()
  })

export const GetAllEnvironmentsOfProjectResponseSchema = PageResponseSchema(
  EnvironmentSchema.extend({
    lastUpdatedBy: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      profilePictureUrl: z.string().nullable()
    })
  })
)

export const DeleteEnvironmentRequestSchema = z.object({
  slug: z.string()
})

export const DeleteEnvironmentResponseSchema = z.void()
