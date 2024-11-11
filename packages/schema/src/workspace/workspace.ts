import { z } from 'zod'
import { PageRequestSchema, PageResponseSchema } from '@/pagination/pagination'
import { projectAccessLevelEnum, rotateAfterEnum } from '@/enums'

export const InviteMemberSchema = z.object({
  email: z.string(),
  roleSlugs: z.array(z.string()).optional()
})

//Request and Response types
export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string(),
  isFreeTier: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  ownerId: z.string(),
  isDefault: z.boolean(),
  lastUpdatedBy: z.string()
})

export const CreateWorkspaceRequestSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  isDefault: z.boolean().optional()
})

export const CreateWorkspaceResponseSchema = WorkspaceSchema

export const UpdateWorkspaceRequestSchema =
  CreateWorkspaceRequestSchema.partial().extend({
    workspaceSlug: z.string()
  })

export const UpdateWorkspaceResponseSchema = WorkspaceSchema

export const DeleteWorkspaceRequestSchema = z.object({
  workspaceSlug: z.string()
})

export const DeleteWorkspaceResponseSchema = z.void()

export const GetWorkspaceRequestSchema = z.object({
  workspaceSlug: z.string()
})

export const GetWorkspaceResponseSchema = WorkspaceSchema

export const GetAllWorkspacesOfUserRequestSchema = PageRequestSchema

export const GetAllWorkspacesOfUserResponseSchema =
  PageResponseSchema(WorkspaceSchema)

export const ExportDataRequestSchema = z.object({
  workspaceSlug: z.string()
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
      authorities: z.array(z.string())
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
          name: z.string(),
          description: z.string()
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
  workspaceSlug: z.string(),
  search: z.string()
})

export const GlobalSearchResponseSchema = z.object({
  projects: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      description: z.string()
    })
  ),
  environments: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      description: z.string()
    })
  ),
  secrets: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      note: z.string()
    })
  ),
  variables: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      note: z.string()
    })
  )
})
