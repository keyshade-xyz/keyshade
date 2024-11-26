import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'

export const EnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  lastUpdatedById: z.string(),
  projectId: z.string()
})

export const CreateEnvironmentRequestSchema = z.object({
  name: EnvironmentSchema.shape.name,
  description: z.string().optional(),
  projectSlug: z.string()
})

export const CreateEnvironmentResponseSchema = EnvironmentSchema

export const UpdateEnvironmentRequestSchema =
  CreateEnvironmentRequestSchema.omit({ projectSlug: true })
    .partial()
    .extend({ slug: EnvironmentSchema.shape.slug })

export const UpdateEnvironmentResponseSchema = EnvironmentSchema

export const GetEnvironmentRequestSchema = z.object({
  slug: EnvironmentSchema.shape.slug
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
      email: z.string().email(),
      profilePictureUrl: z.string().nullable()
    })
  })
)

export const DeleteEnvironmentRequestSchema = z.object({
  slug: EnvironmentSchema.shape.slug
})

export const DeleteEnvironmentResponseSchema = z.void()
