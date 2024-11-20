import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'

export const VariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  note: z.string().nullable(),
  lastUpdatedById: z.string(),
  projectId: z.string(),
  project: z.object({
    workspaceId: z.string()
  }),
  versions: z.array(
    z.object({
      value: z.string(),
      environmentId: z.string(),
      environment: z.object({
        id: z.string(),
        slug: z.string()
      })
    })
  )
})

export const CreateVariableRequestSchema = z.object({
  projectSlug: z.string(),
  name: z.string(),
  note: z.string().optional(),
  entries: z
    .array(
      z.object({
        value: z.string(),
        environmentSlug: z.string()
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
        environmentSlug: z.string()
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
      value: z.string(),
      environmentId: z.string(),
      environment: z.object({
        id: z.string(),
        slug: z.string()
      })
    })
  )
})

export const RollBackVariableRequestSchema = z.object({
  variableSlug: z.string(),
  version: z.number(),
  environmentSlug: z.string()
})

export const RollBackVariableResponseSchema = z.object({
  count: z.string()
})

export const DeleteVariableRequestSchema = z.object({
  variableSlug: z.string()
})

export const DeleteVariableResponseSchema = z.void()

export const GetAllVariablesOfProjectRequestSchema = PageRequestSchema.extend({
  projectSlug: z.string()
})

export const GetAllVariablesOfProjectResponseSchema = PageResponseSchema(
  VariableSchema.omit({ project: true, versions: true }).extend({
    variable: z.object({
      lastUpdatedBy: z.object({
        id: z.string(),
        name: z.string()
      })
    }),
    values: z.array(
      z.object({
        environment: z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string()
        }),
        value: z.string(),
        version: z.number()
      })
    )
  })
)

export const GetAllVariablesOfEnvironmentRequestSchema = z.object({
  projectSlug: z.string(),
  environmentSlug: z.string()
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
    variableSlug: z.string(),
    environmentSlug: z.string()
  })

export const GetRevisionsOfVariableResponseSchema = PageResponseSchema(
  z.object({
    id: z.string(),
    value: z.string(),
    version: z.number(),
    variableId: z.string(),
    createdOn: z.string(),
    createdById: z.string(),
    environmentId: z.string()
  })
)
