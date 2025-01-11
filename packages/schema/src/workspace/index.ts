import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { authorityEnum, projectAccessLevelEnum, rotateAfterEnum } from '@/enums'
import { EnvironmentSchema } from '@/environment'

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable(),
  isFreeTier: z.boolean(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  ownerId: z.string(),
  isDefault: z.boolean(),
  lastUpdatedById: z.string().nullable()
})

export const CreateWorkspaceRequestSchema = z.object({
  name: WorkspaceSchema.shape.name,
  icon: z.string().optional(),
  isDefault: z.boolean().optional()
})

export const CreateWorkspaceResponseSchema = WorkspaceSchema

export const UpdateWorkspaceRequestSchema =
  CreateWorkspaceRequestSchema.partial().extend({
    workspaceSlug: WorkspaceSchema.shape.slug
  })

export const UpdateWorkspaceResponseSchema = WorkspaceSchema

export const DeleteWorkspaceRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const DeleteWorkspaceResponseSchema = z.void()

export const GetWorkspaceRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const GetWorkspaceResponseSchema = WorkspaceSchema

export const InviteMemberRequestSchema = z.object({
  email: z.string().email(),
  roleSlugs: z.array(z.string()).optional()
})

export const InviteMemberResponseSchema = z.void()

export const GetAllWorkspacesOfUserRequestSchema = PageRequestSchema

export const GetAllWorkspacesOfUserResponseSchema =
  PageResponseSchema(WorkspaceSchema)

export const ExportDataRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const ExportDataResponseSchema = z.object({
  name: z.string(),
  icon: z.string(),
  workspaceRoles: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      colorCode: z.string(),
      hasAdminAuthority: z.boolean(),
      authorities: z.array(authorityEnum)
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      publicKey: z.string(),
      privateKey: z.string(),
      storePrivateKey: z.boolean(),
      accessLevel: projectAccessLevelEnum,
      environments: z.array(
        z.object({
          name: EnvironmentSchema.shape.name,
          description: EnvironmentSchema.shape.description
        })
      ),
      secrets: z.array(
        z.object({
          name: z.string(),
          note: z.string(),
          rotateAt: rotateAfterEnum,
          versions: z.array(
            z.object({
              value: z.string(),
              version: z.number()
            })
          )
        })
      ),
      variables: z.array(
        z.object({
          name: z.string(),
          note: z.string(),
          versions: z.array(
            z.object({
              value: z.string(),
              version: z.number()
            })
          )
        })
      )
    })
  )
})

export const GlobalSearchRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  search: z.string()
})

export const GlobalSearchResponseSchema = z.object({
  projects: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      description: z.string()
    })
  ),
  environments: z.array(
    z.object({
      slug: EnvironmentSchema.shape.slug,
      name: EnvironmentSchema.shape.name,
      description: EnvironmentSchema.shape.description
    })
  ),
  secrets: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      note: z.string()
    })
  ),
  variables: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      note: z.string()
    })
  )
})

export const GetWorkspaceInvitationsRequest = PageRequestSchema

export const GetWorkspaceInvitationsResponse = PageResponseSchema(
  z.object({
    workspace: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      icon: z.string().nullable()
    }),
    roles: z.array(
      z.object({
        role: z.object({
          name: z.string(),
          colorCode: z.string().nullable()
        })
      })
    ),
    invitedOn: z.string().datetime()
  })
)
