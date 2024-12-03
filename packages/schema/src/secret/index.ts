import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { rotateAfterEnum } from '@/enums'

export const SecretSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  rotateAt: z.string().nullable(),
  note: z.string().nullable(),
  lastUpdatedById: z.string(),
  projectId: z.string(),
  project: z.object({
    workspaceId: z.string()
  }),
  versions: z.array(
    z.object({
      id: z.string().optional(),
      environmentId: z.string(),
      value: z.string(),
      environment: z.object({
        id: z.string(),
        slug: z.string()
      })
    })
  )
})

export const CreateSecretRequestSchema = z.object({
  projectSlug: z.string(),
  name: z.string(),
  note: z.string().optional(),
  rotateAfter: rotateAfterEnum.optional(),
  entries: z
    .array(
      z.object({
        value: z.string(),
        environmentSlug: z.string()
      })
    )
    .optional()
})

export const CreateSecretResponseSchema = SecretSchema

export const UpdateSecretRequestSchema =
  CreateSecretRequestSchema.partial().extend({
    secretSlug: z.string()
  })

export const UpdateSecretResponseSchema = z.object({
  secret: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    note: z.string().nullable()
  }),
  updatedVersions: z.array(
    z.object({
      id: z.string().optional(),
      environmentId: z.string(),
      environment: z.object({
        id: z.string(),
        slug: z.string()
      }),
      value: z.string()
    })
  )
})

export const DeleteSecretRequestSchema = z.object({
  secretSlug: z.string()
})

export const DeleteSecretResponseSchema = z.void()

export const RollBackSecretRequestSchema = z.object({
  environmentSlug: z.string(),
  version: z.number(),
  secretSlug: z.string()
})

export const RollBackSecretResponseSchema = z.object({
  count: z.string()
})

export const GetAllSecretsOfProjectRequestSchema = PageRequestSchema.extend({
  projectSlug: z.string()
})

export const GetAllSecretsOfProjectResponseSchema = PageResponseSchema(
  z.object({
    secret: SecretSchema.omit({ versions: true, project: true }).extend({
      lastUpdatedBy: z.object({
        id: z.string(),
        name: z.string()
      })
    }),
    values: z.object({
      environment: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string()
      }),
      value: z.string(),
      version: z.number()
    })
  })
)

export const GetAllSecretsOfEnvironmentRequestSchema = z.object({
  projectSlug: z.string(),
  environmentSlug: z.string()
})

export const GetAllSecretsOfEnvironmentResponseSchema = z.array(
  z.object({
    name: z.string(),
    value: z.string(),
    isPlaintext: z.boolean()
  })
)

export const GetRevisionsOfSecretRequestSchema =
  PageRequestSchema.partial().extend({
    secretSlug: z.string(),
    environmentSlug: z.string()
  })

export const GetRevisionsOfSecretResponseSchema = PageResponseSchema(
  z.object({
    id: z.string(),
    value: z.string(),
    version: z.number(),
    createdOn: z.string(),
    createdById: z.string(),
    environmentId: z.string()
  })
)
