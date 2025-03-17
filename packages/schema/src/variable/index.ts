import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { EnvironmentSchema } from '@/environment'
import { BaseProjectSchema } from '@/project'
import { UserSchema } from '@/user'

export const VariableVersionSchema = z.object({
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
  variable: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    note: z.string().nullable(),
    lastUpdatedById: z.string(),
    projectId: BaseProjectSchema.shape.id,
    lastUpdatedBy: z.object({
      id: UserSchema.shape.id,
      name: UserSchema.shape.name,
      profilePictureUrl: UserSchema.shape.profilePictureUrl
    })
  }),
  values: z.array(VariableVersionSchema)
})

export const CreateVariableRequestSchema = z.object({
  projectSlug: BaseProjectSchema.shape.slug,
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

export const UpdateVariableResponseSchema = z.object({
  variable: VariableSchema.shape.variable.pick({
    id: true,
    name: true,
    slug: true,
    note: true
  }),
  updatedVersions: z.array(VariableVersionSchema)
})

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
  currentRevision: VariableVersionSchema
})

export const DeleteVariableRequestSchema = z.object({
  variableSlug: z.string()
})

export const DeleteVariableResponseSchema = z.void()

export const GetAllVariablesOfProjectRequestSchema = PageRequestSchema.extend({
  projectSlug: BaseProjectSchema.shape.slug
})

export const GetAllVariablesOfProjectResponseSchema =
  PageResponseSchema(VariableSchema)

export const GetRevisionsOfVariableRequestSchema =
  PageRequestSchema.partial().extend({
    variableSlug: z.string(),
    environmentSlug: EnvironmentSchema.shape.slug
  })

export const GetRevisionsOfVariableResponseSchema = PageResponseSchema(
  VariableVersionSchema
)

export const GetAllVariablesOfEnvironmentRequestSchema = z.object({
  projectSlug: BaseProjectSchema.shape.slug,
  environmentSlug: EnvironmentSchema.shape.slug
})

export const GetAllVariablesOfEnvironmentResponseSchema = z.array(
  z.object({
    name: z.string(),
    value: z.string(),
    isPlaintext: z.boolean()
  })
)
