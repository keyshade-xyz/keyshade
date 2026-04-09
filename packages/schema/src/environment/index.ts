import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { AlphaNumericStringSchema } from '@/alphanumeric'

export const EnvironmentSchema = z.object({
  id: z.string(),
  name: AlphaNumericStringSchema.refine((val) => val.length >= 3, {
    message: 'Environment name must be at least 3 characters long'
  }),
  slug: z.string(),
  description: AlphaNumericStringSchema.optional(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  projectId: z.string(),
  lastUpdatedById: z.string(),
  entitlements: z.object({
    canUpdate: z.boolean(),
    canDelete: z.boolean()
  }),
  project: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    workspaceId: z.string()
  }),
  lastUpdatedBy: z.object({
    id: z.string(),
    name: z.string(),
    profilePictureUrl: z.string().nullable()
  })
})

export const CreateEnvironmentRequestSchema = z.object({
  name: EnvironmentSchema.shape.name,
  description: AlphaNumericStringSchema.optional(),
  projectSlug: z.string()
})

export const CreateEnvironmentResponseSchema = EnvironmentSchema.omit({
  project: true
})

export const UpdateEnvironmentRequestSchema =
  CreateEnvironmentRequestSchema.omit({ projectSlug: true })
    .partial()
    .extend({ slug: EnvironmentSchema.shape.slug })

export const UpdateEnvironmentResponseSchema = EnvironmentSchema.omit({
  project: true
})

export const GetEnvironmentRequestSchema = z.object({
  slug: EnvironmentSchema.shape.slug
})

export const GetEnvironmentResponseSchema = EnvironmentSchema.omit({
  project: true
})

export const GetAllEnvironmentsOfProjectRequestSchema =
  PageRequestSchema.extend({
    projectSlug: z.string()
  })

export const GetAllEnvironmentsOfProjectResponseSchema = PageResponseSchema(
  EnvironmentSchema.omit({ project: true })
)

export const DeleteEnvironmentRequestSchema = z.object({
  slug: EnvironmentSchema.shape.slug
})

export const DeleteEnvironmentResponseSchema = z.null()
