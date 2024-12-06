import { z } from 'zod'

import {
  WorkspaceRoleSchema,
  CreateWorkspaceRoleRequestSchema,
  CreateWorkspaceRoleResponseSchema,
  UpdateWorkspaceRoleRequestSchema,
  UpdateWorkspaceRoleResponseSchema,
  DeleteWorkspaceRoleRequestSchema,
  DeleteWorkspaceRoleResponseSchema,
  CheckWorkspaceRoleExistsRequestSchema,
  CheckWorkspaceRoleExistsResponseSchema,
  GetWorkspaceRoleRequestSchema,
  GetWorkspaceRoleResponseSchema,
  GetWorkspaceRolesOfWorkspaceRequestSchema,
  GetWorkspaceRolesOfWorkspaceResponseSchema
} from './'

export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>

export type CreateWorkspaceRoleRequest = z.infer<
  typeof CreateWorkspaceRoleRequestSchema
>

export type CreateWorkspaceRoleResponse = z.infer<
  typeof CreateWorkspaceRoleResponseSchema
>

export type UpdateWorkspaceRoleRequest = z.infer<
  typeof UpdateWorkspaceRoleRequestSchema
>

export type UpdateWorkspaceRoleResponse = z.infer<
  typeof UpdateWorkspaceRoleResponseSchema
>

export type DeleteWorkspaceRoleRequest = z.infer<
  typeof DeleteWorkspaceRoleRequestSchema
>

export type DeleteWorkspaceRoleResponse = z.infer<
  typeof DeleteWorkspaceRoleResponseSchema
>

export type CheckWorkspaceRoleExistsRequest = z.infer<
  typeof CheckWorkspaceRoleExistsRequestSchema
>

export type CheckWorkspaceRoleExistsResponse = z.infer<
  typeof CheckWorkspaceRoleExistsResponseSchema
>

export type GetWorkspaceRoleRequest = z.infer<
  typeof GetWorkspaceRoleRequestSchema
>

export type GetWorkspaceRoleResponse = z.infer<
  typeof GetWorkspaceRoleResponseSchema
>

export type GetWorkspaceRolesOfWorkspaceRequest = z.infer<
  typeof GetWorkspaceRolesOfWorkspaceRequestSchema
>

export type GetWorkspaceRolesOfWorkspaceResponse = z.infer<
  typeof GetWorkspaceRolesOfWorkspaceResponseSchema
>
