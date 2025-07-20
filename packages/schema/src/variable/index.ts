import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { EnvironmentSchema } from '@/environment'
import { UserSchema } from '@/user'

export const VariableRevisionSchema = z.object({
  version: z.number(),
  value: z.string(),
  createdOn: z.string().datetime(),
  environment: z.object({
    id: EnvironmentSchema.shape.id,
    name: EnvironmentSchema.shape.name,
    slug: EnvironmentSchema.shape.slug
  }),
  createdBy: z.object({
    id: UserSchema.shape.id,
    name: UserSchema.shape.name,
    profilePictureUrl: UserSchema.shape.profilePictureUrl
  })
})

export const VariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  note: z.string().nullable(),
  lastUpdatedById: z.string(),
  projectId: z.string(),
  lastUpdatedBy: z.object({
    id: UserSchema.shape.id,
    name: UserSchema.shape.name,
    profilePictureUrl: UserSchema.shape.profilePictureUrl
  }),
  entitlements: z.object({
    canUpdate: z.boolean(),
    canDelete: z.boolean()
  }),
  versions: z.array(VariableRevisionSchema)
})
export const CreateVariableRequestSchema = z.object({
  projectSlug: z.string(),
  name: z.string(),
  note: z.string().optional(),
  entries: z
    .array(
      z.object({
        value: z.string(),
        environmentSlug: EnvironmentSchema.shape.slug
      })
    )
    .optional()
})

export const CreateVariableResponseSchema = VariableSchema

export const BulkCreateVariableRequestSchema = z.object({
  projectSlug: z.string(),
  variables: z.array(CreateVariableRequestSchema.omit({ projectSlug: true }))
})

export const BulkCreateVariableResponseSchema = z.object({
  successful: z.array(VariableSchema),
  failed: z.array(
    z.object({
      name: z.string(),
      error: z.string()
    })
  )
})

export const UpdateVariableRequestSchema = z.object({
  variableSlug: z.string(),
  name: z.string().optional(),
  note: z.string().optional(),
  entries: z
    .array(
      z.object({
        value: z.string(),
        environmentSlug: EnvironmentSchema.shape.slug
      })
    )
    .optional()
})

export const UpdateVariableResponseSchema = VariableSchema

export const DeleteEnvironmentValueOfVariableRequestSchema = z.object({
  variableSlug: z.string(),
  environmentSlug: z.string()
})

export const DeleteEnvironmentValueOfVariableResponseSchema = z.void()

export const RollBackVariableRequestSchema = z.object({
  variableSlug: z.string(),
  version: z.number(),
  environmentSlug: EnvironmentSchema.shape.slug
})

export const RollBackVariableResponseSchema = z.object({
  count: z.number(),
  currentRevision: VariableRevisionSchema
})

export const DeleteVariableRequestSchema = z.object({
  variableSlug: z.string()
})

export const DeleteVariableResponseSchema = z.void()

export const GetAllVariablesOfProjectRequestSchema = PageRequestSchema.extend({
  projectSlug: z.string()
})

export const GetAllVariablesOfProjectResponseSchema =
  PageResponseSchema(VariableSchema)

export const GetRevisionsOfVariableRequestSchema =
  PageRequestSchema.partial().extend({
    variableSlug: z.string(),
    environmentSlug: EnvironmentSchema.shape.slug
  })

export const GetRevisionsOfVariableResponseSchema = PageResponseSchema(
  VariableRevisionSchema
)

export const GetAllVariablesOfEnvironmentRequestSchema = z.object({
  projectSlug: z.string(),
  environmentSlug: EnvironmentSchema.shape.slug
})

export const GetAllVariablesOfEnvironmentResponseSchema = z.array(
  z.object({
    name: z.string(),
    value: z.string(),
    isPlaintext: z.boolean()
  })
)
