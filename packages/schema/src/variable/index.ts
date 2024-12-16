import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { EnvironmentSchema } from '@/environment'
import { BaseProjectSchema } from '@/project'
import { WorkspaceSchema } from '@/workspace'

export const VariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  note: z.string().nullable(),
  lastUpdatedById: z.string(),
  projectId: BaseProjectSchema.shape.id,
  project: z.object({
    workspaceId: WorkspaceSchema.shape.id
  }),
  versions: z.array(
    z.object({
      value: z.string(),
      environment: z.object({
        id: EnvironmentSchema.shape.id,
        slug: EnvironmentSchema.shape.slug
      })
    })
  )
})

export const CreateVariableRequestSchema = z.object({
  projectSlug: BaseProjectSchema.shape.slug,
  name: VariableSchema.shape.name,
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
  variableSlug: VariableSchema.shape.slug,
  name: VariableSchema.shape.name.optional(),
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
  variable: VariableSchema.pick({
    id: true,
    name: true,
    slug: true,
    note: true
  }),
  updatedVersions: z.array(
    z.object({
      id: z.string(),
      value: z.string(),
      version: z.number(),
      environment: z.object({
        id: EnvironmentSchema.shape.id,
        slug: EnvironmentSchema.shape.slug
      })
    })
  )
})

export const RollBackVariableRequestSchema = z.object({
  variableSlug: VariableSchema.shape.slug,
  version: z.number(),
  environmentSlug: EnvironmentSchema.shape.slug
})

export const RollBackVariableResponseSchema = z.object({
  count: z.number()
})

export const DeleteVariableRequestSchema = z.object({
  variableSlug: VariableSchema.shape.slug
})

export const DeleteVariableResponseSchema = z.void()

export const GetAllVariablesOfProjectRequestSchema = PageRequestSchema.extend({
  projectSlug: BaseProjectSchema.shape.slug
})

export const GetAllVariablesOfProjectResponseSchema = PageResponseSchema(
  z.object({
    variable: VariableSchema.omit({ project: true, versions: true }).extend({
      lastUpdatedBy: z.object({
        id: z.string(),
        name: z.string()
      })
    }),
    values: z.array(
      z.object({
        environment: z.object({
          id: EnvironmentSchema.shape.id,
          name: EnvironmentSchema.shape.name,
          slug: EnvironmentSchema.shape.slug
        }),
        value: z.string(),
        version: z.number()
      })
    )
  })
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

export const GetRevisionsOfVariableRequestSchema =
  PageRequestSchema.partial().extend({
    variableSlug: VariableSchema.shape.slug,
    environmentSlug: EnvironmentSchema.shape.slug
  })

export const GetRevisionsOfVariableResponseSchema = PageResponseSchema(
  z.object({
    id: z.string(),
    value: z.string(),
    version: z.number(),
    variableId: VariableSchema.shape.id,
    createdOn: z.string().datetime(),
    createdById: z.string(),
    environmentId: EnvironmentSchema.shape.id
  })
)
