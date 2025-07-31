import { z } from 'zod'
import { authorityEnum } from '@/enums'
import { PageRequestSchema, PageResponseSchema } from '@/pagination'
import { WorkspaceSchema } from '@/workspace'
import { UserSchema } from '@/user'

export const WorkspaceMemberSchema = z.object({
  id: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    profilePictureUrl: z.string().nullable(),
    email: z.string().email(),
    joinedOn: z.string().datetime()
  }),
  roles: z.array(
    z.object({
      id: z.string(),
      role: z.object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        colorCode: z.string().nullable(),
        authorities: z.array(authorityEnum)
      })
    })
  ),
  invitationAccepted: z.boolean(),
  entitlements: z.object({
    canUpdateRoles: z.boolean(),
    canTransferOwnershipTo: z.boolean(),
    canRemove: z.boolean(),
    canCancelInvitation: z.boolean(),
    canResendInvitation: z.boolean()
  })
})

export const CreateWorkspaceMemberSchema = z.object({
  email: z.string().email(),
  roleSlugs: z.array(z.string())
})

export const TransferOwnershipRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  userEmail: UserSchema.shape.email
})

export const TransferOwnershipResponseSchema = z.void()

export const InviteUsersRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  members: z.array(CreateWorkspaceMemberSchema)
})

export const InviteUsersResponseSchema = z.array(WorkspaceMemberSchema)

export const RemoveUsersRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  userEmails: z.string() // comma separated emails
})

export const RemoveUsersResponseSchema = z.void()

export const UpdateMemberRoleRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  userEmail: UserSchema.shape.email,
  roleSlugs: z.array(z.string())
})

export const UpdateMemberRoleResponseSchema = WorkspaceMemberSchema

export const AcceptInvitationRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const AcceptInvitationResponseSchema = z.void()

export const DeclineInvitationRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const DeclineInvitationResponseSchema = z.void()

export const CancelInvitationRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  userEmail: UserSchema.shape.email
})

export const CancelInvitationResponseSchema = z.void()

export const LeaveWorkspaceRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const LeaveWorkspaceResponseSchema = z.void()

export const IsMemberRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  userEmail: UserSchema.shape.email
})

export const IsMemberResponseSchema = z.boolean()

export const ResendInvitationRequestSchema = z.object({
  workspaceSlug: WorkspaceSchema.shape.slug,
  userEmail: UserSchema.shape.email
})

export const ResendInvitationResponseSchema = z.void()

export const GetMembersRequestSchema = PageRequestSchema.extend({
  workspaceSlug: WorkspaceSchema.shape.slug
})

export const GetMembersResponseSchema = PageResponseSchema(
  WorkspaceMemberSchema
)
