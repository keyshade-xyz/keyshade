import { z } from 'zod'

import {
  CreateWorkspaceMemberSchema,
  TransferOwnershipRequestSchema,
  TransferOwnershipResponseSchema,
  InviteUsersRequestSchema,
  InviteUsersResponseSchema,
  RemoveUsersRequestSchema,
  RemoveUsersResponseSchema,
  UpdateMemberRoleRequestSchema,
  UpdateMemberRoleResponseSchema,
  AcceptInvitationRequestSchema,
  AcceptInvitationResponseSchema,
  DeclineInvitationRequestSchema,
  DeclineInvitationResponseSchema,
  CancelInvitationRequestSchema,
  CancelInvitationResponseSchema,
  LeaveWorkspaceRequestSchema,
  LeaveWorkspaceResponseSchema,
  IsMemberRequestSchema,
  IsMemberResponseSchema,
  GetMembersRequestSchema,
  GetMembersResponseSchema,
  ResendInvitationRequestSchema,
  ResendInvitationResponseSchema,
  WorkspaceMemberSchema
} from './'

export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>

export type CreateWorkspaceMember = z.infer<typeof CreateWorkspaceMemberSchema>

export type TransferOwnershipRequest = z.infer<
  typeof TransferOwnershipRequestSchema
>

export type TransferOwnershipResponse = z.infer<
  typeof TransferOwnershipResponseSchema
>

export type InviteUsersRequest = z.infer<typeof InviteUsersRequestSchema>

export type InviteUsersResponse = z.infer<typeof InviteUsersResponseSchema>

export type RemoveUsersRequest = z.infer<typeof RemoveUsersRequestSchema>

export type RemoveUsersResponse = z.infer<typeof RemoveUsersResponseSchema>

export type UpdateMemberRoleRequest = z.infer<
  typeof UpdateMemberRoleRequestSchema
>

export type UpdateMemberRoleResponse = z.infer<
  typeof UpdateMemberRoleResponseSchema
>

export type AcceptInvitationRequest = z.infer<
  typeof AcceptInvitationRequestSchema
>

export type AcceptInvitationResponse = z.infer<
  typeof AcceptInvitationResponseSchema
>

export type DeclineInvitationRequest = z.infer<
  typeof DeclineInvitationRequestSchema
>

export type DeclineInvitationResponse = z.infer<
  typeof DeclineInvitationResponseSchema
>

export type CancelInvitationRequest = z.infer<
  typeof CancelInvitationRequestSchema
>

export type CancelInvitationResponse = z.infer<
  typeof CancelInvitationResponseSchema
>

export type LeaveWorkspaceRequest = z.infer<typeof LeaveWorkspaceRequestSchema>

export type LeaveWorkspaceResponse = z.infer<
  typeof LeaveWorkspaceResponseSchema
>

export type IsMemberRequest = z.infer<typeof IsMemberRequestSchema>

export type IsMemberResponse = z.infer<typeof IsMemberResponseSchema>

export type ResendInvitationRequest = z.infer<
  typeof ResendInvitationRequestSchema
>

export type ResendInvitationResponse = z.infer<
  typeof ResendInvitationResponseSchema
>

export type GetMembersRequest = z.infer<typeof GetMembersRequestSchema>

export type GetMembersResponse = z.infer<typeof GetMembersResponseSchema>
