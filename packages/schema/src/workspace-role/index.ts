import { authorityEnum } from '@/enums'
import { EnvironmentSchema } from '@/environment'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { WorkspaceSchema } from '@/workspace'
import { z } from 'zod'

export const WorkspaceRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  colorCode: z.string().nullable(),
  hasAdminAuthority: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  authorities: z.array(authorityEnum),
  workspaceId: WorkspaceSchema.shape.id,
  projects: z.array(
    z.object({
      project: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        workspaceId: z.string()
      }),
      environments: z.array(
        z.object({
          id: EnvironmentSchema.shape.id,
          name: EnvironmentSchema.shape.name,
          slug: EnvironmentSchema.shape.slug
        })
      )
    })
  ),
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      profilePictureUrl: z.string().nullable(),
      memberSince: z.string().datetime(),
      invitationAccepted: z.boolean()
    })
  ),
  entitlements: z.object({
    canUpdate: z.boolean(),
    canDelete: z.boolean()
  })
})

export const CreateWorkspaceRoleRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  name: WorkspaceRoleSchema.shape.name,
  description: z.string().optional(),
  colorCode: z.string().optional(),
  authorities: z.array(authorityEnum).optional(),
  projectEnvironments: z
    .array(
      z.object({
        projectSlug: z.string(),
        environmentSlugs: z.array(EnvironmentSchema.shape.slug).optional()
      })
    )
    .optional()
})

export const CreateWorkspaceRoleResponseSchema = WorkspaceRoleSchema

export const UpdateWorkspaceRoleRequestSchema =
  CreateWorkspaceRoleRequestSchema.partial().extend({
    workspaceRoleSlug: WorkspaceRoleSchema.shape.slug
  })

export const UpdateWorkspaceRoleResponseSchema = WorkspaceRoleSchema

export const DeleteWorkspaceRoleRequestSchema = z.object({
  workspaceRoleSlug: WorkspaceRoleSchema.shape.slug
})

export const DeleteWorkspaceRoleResponseSchema = z.void()

export const CheckWorkspaceRoleExistsRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  workspaceRoleName: WorkspaceRoleSchema.shape.name
})

export const CheckWorkspaceRoleExistsResponseSchema = z.object({
  exists: z.boolean()
})

export const GetWorkspaceRoleRequestSchema = z.object({
  workspaceRoleSlug: WorkspaceRoleSchema.shape.slug
})

export const GetWorkspaceRoleResponseSchema = WorkspaceRoleSchema

export const GetWorkspaceRolesOfWorkspaceRequestSchema =
  PageRequestSchema.merge(
    z.object({
      workspaceSlug: WorkspaceSchema.shape.slug
    })
  )

export const GetWorkspaceRolesOfWorkspaceResponseSchema =
  PageResponseSchema(WorkspaceRoleSchema)
