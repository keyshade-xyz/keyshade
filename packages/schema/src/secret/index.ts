import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { rotateAfterEnum } from '@/enums'
import { EnvironmentSchema } from '@/environment'
import { BaseProjectSchema } from '@/project'
import { UserSchema } from '@/user'

export const SecretVersionSchema = z.object({
  value: z.string(),
  version: z.number(),
  createdOn: z.string().datetime(),
  environment: z.object({
    id: EnvironmentSchema.shape.id,
    name: EnvironmentSchema.shape.name,
    slug: EnvironmentSchema.shape.slug,
    // THESE TWO VALUES ARE ONLY AVAILABLE IN GetRevisionsOfSecretResponseSchema
    maxAllowedRevisions: z.number(),
    totalRevisions: z.number()
  }),
  createdBy: z.object({
    id: UserSchema.shape.id,
    name: UserSchema.shape.name,
    profilePictureUrl: UserSchema.shape.profilePictureUrl
  })
})

export const SecretSchema = z.object({
  secret: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    rotateAt: z.string().datetime().nullable(),
    note: z.string().nullable(),
    lastUpdatedById: z.string(),
    projectId: BaseProjectSchema.shape.id,
    lastUpdatedBy: z.object({
      id: UserSchema.shape.id,
      name: UserSchema.shape.name,
      profilePictureUrl: UserSchema.shape.profilePictureUrl
    })
  }),
  values: z.array(SecretVersionSchema)
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

export const UpdateSecretRequestSchema =
  CreateSecretRequestSchema.partial().extend({
    secretSlug: z.string()
  })

export const UpdateSecretResponseSchema = z.object({
  secret: SecretSchema.shape.secret.pick({
    id: true,
    name: true,
    slug: true,
    note: true
  }),
  updatedVersions: z.array(SecretVersionSchema)
})

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
  currentRevision: SecretVersionSchema
})

export const GetAllSecretsOfProjectRequestSchema = PageRequestSchema.extend({
  projectSlug: BaseProjectSchema.shape.slug
})

export const GetAllSecretsOfProjectResponseSchema =
  PageResponseSchema(SecretSchema)

export const GetRevisionsOfSecretRequestSchema =
  PageRequestSchema.partial().extend({
    secretSlug: z.string(),
    environmentSlug: EnvironmentSchema.shape.slug
  })

export const GetRevisionsOfSecretResponseSchema =
  PageResponseSchema(SecretVersionSchema)

export const GetAllSecretsOfEnvironmentRequestSchema = z.object({
  projectSlug: BaseProjectSchema.shape.slug,
  environmentSlug: EnvironmentSchema.shape.slug
})

export const GetAllSecretsOfEnvironmentResponseSchema = z.array(
  z.object({
    name: z.string(),
    value: z.string()
  })
)
