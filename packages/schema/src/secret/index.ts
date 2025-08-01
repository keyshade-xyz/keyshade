import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { rotateAfterEnum } from '@/enums'
import { EnvironmentSchema } from '@/environment'
import { UserSchema } from '@/user'

export const SecretRevisionSchema = z.object({
  value: z.string(),
  version: z.number(),
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

export const SecretSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  rotateAt: z.string().datetime().nullable(),
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
  versions: z.array(SecretRevisionSchema)
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
        environmentSlug: EnvironmentSchema.shape.slug
      })
    )
    .optional()
})

export const CreateSecretResponseSchema = SecretSchema

export const BulkCreateSecretRequestSchema = z.object({
  projectSlug: z.string(),
  secrets: z.array(CreateSecretRequestSchema.omit({ projectSlug: true }))
})

export const BulkCreateSecretResponseSchema = z.object({
  successful: z.array(SecretSchema),
  failed: z.array(
    z.object({
      name: z.string(),
      error: z.string()
    })
  )
})

export const UpdateSecretRequestSchema =
  CreateSecretRequestSchema.partial().extend({
    secretSlug: z.string()
  })

export const UpdateSecretResponseSchema = SecretSchema

export const DeleteEnvironmentValueOfSecretRequestSchema = z.object({
  secretSlug: z.string(),
  environmentSlug: z.string()
})

export const DeleteEnvironmentValueOfSecretResponseSchema = z.void()

export const DeleteSecretRequestSchema = z.object({
  secretSlug: z.string()
})

export const DeleteSecretResponseSchema = z.void()

export const RollBackSecretRequestSchema = z.object({
  environmentSlug: EnvironmentSchema.shape.slug,
  version: z.number(),
  secretSlug: z.string()
})

export const RollBackSecretResponseSchema = z.object({
  count: z.number(),
  currentRevision: SecretRevisionSchema
})

export const DisableSecretRequestSchema = z.object({
  secretSlug: z.string(),
  environmentSlug: EnvironmentSchema.shape.slug
})

export const DisableSecretResponseSchema = z.void()

export const EnableSecretRequestSchema = z.object({
  secretSlug: z.string(),
  environmentSlug: EnvironmentSchema.shape.slug
})

export const EnableSecretResponseSchema = z.void()

export const getAllDisabledEnvironmentsOfSecretRequestSchema = z.object({
  secretSlug: z.string()
})

export const getAllDisabledEnvironmentsOfSecretResponseSchema = z.array(
  z.string()
)

export const GetAllSecretsOfProjectRequestSchema = PageRequestSchema.extend({
  projectSlug: z.string()
})

export const GetAllSecretsOfProjectResponseSchema =
  PageResponseSchema(SecretSchema)

export const GetRevisionsOfSecretRequestSchema =
  PageRequestSchema.partial().extend({
    secretSlug: z.string(),
    environmentSlug: EnvironmentSchema.shape.slug
  })

export const GetRevisionsOfSecretResponseSchema =
  PageResponseSchema(SecretRevisionSchema)

export const GetAllSecretsOfEnvironmentRequestSchema = z.object({
  projectSlug: z.string(),
  environmentSlug: EnvironmentSchema.shape.slug
})

export const GetAllSecretsOfEnvironmentResponseSchema = z.array(
  z.object({
    name: z.string(),
    value: z.string()
  })
)
