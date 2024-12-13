import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { rotateAfterEnum } from '@/enums'
import { EnvironmentSchema } from '@/environment'
import { BaseProjectSchema } from '@/project'
import { WorkspaceSchema } from '@/workspace'

export const SecretSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  rotateAt: z.string().datetime().nullable(),
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

export const CreateSecretRequestSchema = z.object({
  projectSlug: z.string(),
  name: SecretSchema.shape.name,
  note: z.string().optional(),
  rotateAfter: rotateAfterEnum.optional(),
  entries: z
    .array(
      z.object({
        value: z.string(),
        environmentSlug: EnvironmentSchema.shape.slug
      })
    )
    .optional()
})

export const CreateSecretResponseSchema = SecretSchema

export const UpdateSecretRequestSchema =
  CreateSecretRequestSchema.partial().extend({
    secretSlug: SecretSchema.shape.slug
  })

export const UpdateSecretResponseSchema = z.object({
  secret: z.object({
    id: SecretSchema.shape.id,
    name: SecretSchema.shape.name,
    slug: SecretSchema.shape.slug,
    note: SecretSchema.shape.note
  }),
  updatedVersions: z.array(
    z.object({
      id: z.string().optional(),
      version: z.number(),
      environment: z.object({
        id: EnvironmentSchema.shape.id,
        slug: EnvironmentSchema.shape.slug
      }),
      value: z.string()
    })
  )
})

export const DeleteSecretRequestSchema = z.object({
  secretSlug: SecretSchema.shape.slug
})

export const DeleteSecretResponseSchema = z.void()

export const RollBackSecretRequestSchema = z.object({
  environmentSlug: EnvironmentSchema.shape.slug,
  version: z.number(),
  secretSlug: SecretSchema.shape.slug
})

export const RollBackSecretResponseSchema = z.object({
  count: z.number()
})

export const GetAllSecretsOfProjectRequestSchema = PageRequestSchema.extend({
  projectSlug: BaseProjectSchema.shape.slug,
  decryptValue: z.boolean().optional()
})

export const GetAllSecretsOfProjectResponseSchema = PageResponseSchema(
  z.object({
    secret: SecretSchema.omit({ versions: true, project: true }).extend({
      lastUpdatedBy: z.object({
        id: z.string(),
        name: z.string()
      }),
      versions: z.array(
        z.object({
          environment: z.object({
            id: EnvironmentSchema.shape.id,
            slug: EnvironmentSchema.shape.slug,
            name: EnvironmentSchema.shape.name
          })
        })
      )
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
  projectSlug: BaseProjectSchema.shape.slug,
  environmentSlug: EnvironmentSchema.shape.slug
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
    secretSlug: SecretSchema.shape.slug,
    environmentSlug: EnvironmentSchema.shape.slug
  })

export const GetRevisionsOfSecretResponseSchema = PageResponseSchema(
  z.object({
    id: z.string(),
    value: z.string(),
    version: z.number(),
    secretId: SecretSchema.shape.id,
    createdOn: z.string().datetime(),
    createdById: z.string().nullable(),
    environmentId: EnvironmentSchema.shape.id
  })
)
