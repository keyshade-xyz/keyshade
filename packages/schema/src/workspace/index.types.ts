import { z } from 'zod'
import {
  WorkspaceSchema,
  CreateWorkspaceRequestSchema,
  CreateWorkspaceResponseSchema,
  UpdateWorkspaceRequestSchema,
  UpdateWorkspaceResponseSchema,
  DeleteWorkspaceRequestSchema,
  DeleteWorkspaceResponseSchema,
  GetWorkspaceRequestSchema,
  GetWorkspaceResponseSchema,
  InviteMemberRequestSchema,
  InviteMemberResponseSchema,
  GetAllWorkspacesOfUserResponseSchema,
  ExportDataRequestSchema,
  ExportDataResponseSchema,
  GlobalSearchRequestSchema,
  GlobalSearchResponseSchema
} from '.'
import { PageRequestSchema } from '..'

export type Workspace = z.infer<typeof WorkspaceSchema>

export type CreateWorkspaceRequest = z.infer<
  typeof CreateWorkspaceRequestSchema
>

export type CreateWorkspaceResponse = z.infer<
  typeof CreateWorkspaceResponseSchema
>

export type UpdateWorkspaceRequest = z.infer<
  typeof UpdateWorkspaceRequestSchema
>

export type UpdateWorkspaceResponse = z.infer<
  typeof UpdateWorkspaceResponseSchema
>

export type DeleteWorkspaceRequest = z.infer<
  typeof DeleteWorkspaceRequestSchema
>

export type DeleteWorkspaceResponse = z.infer<
  typeof DeleteWorkspaceResponseSchema
>

export type GetWorkspaceRequest = z.infer<typeof GetWorkspaceRequestSchema>

export type GetWorkspaceResponse = z.infer<typeof GetWorkspaceResponseSchema>

export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>

export type InviteMemberResponse = z.infer<typeof InviteMemberResponseSchema>

export type GetAllWorkspacesOfUserRequest = z.infer<typeof PageRequestSchema>

export type GetAllWorkspacesOfUserResponse = z.infer<
  typeof GetAllWorkspacesOfUserResponseSchema
>

export type ExportDataRequest = z.infer<typeof ExportDataRequestSchema>

export type ExportDataResponse = z.infer<typeof ExportDataResponseSchema>

export type GlobalSearchRequest = z.infer<typeof GlobalSearchRequestSchema>

export type GlobalSearchResponse = z.infer<typeof GlobalSearchResponseSchema>
