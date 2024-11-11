import { z } from 'zod'
import {
  PageRequest,
  PageResponse,
  ResponseError,
  ClientResponse
} from './pagination/pagination.types'
import { CreateApiKeySchema, UpdateApiKeySchema } from './api-key'
import { ResendOTPRequest, ResendOTPResponse } from './auth/auth.types'
import { CreateEnvironmentSchema, UpdateEnvironmentSchema } from './environment'
import { CreateIntegrationSchema, UpdateIntegrationSchema } from './integration'
import {
  CreateProjectSchema,
  ForkProjectSchema,
  UpdateProjectSchema
} from './project'
import { CreateSecretSchema, UpdateSecretSchema } from './secret'
import { CreateVariableSchema, UpdateVariableSchema } from './variable'
import {
  Workspace,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  UpdateWorkspaceRequest,
  UpdateWorkspaceResponse,
  DeleteWorkspaceRequest,
  DeleteWorkspaceResponse,
  GetWorkspaceRequest,
  GetWorkspaceResponse,
  GetAllWorkspacesOfUserRequest,
  GetAllWorkspacesOfUserResponse,
  ExportDataRequest,
  ExportDataResponse,
  GlobalSearchRequest,
  GlobalSearchResponse
} from './workspace/workspace.types'
import {
  CreateWorkspaceRoleSchema,
  UpdateWorkspaceRoleSchema
} from './workspace-role'

//Export types from pagination.types.ts with T prefix
export type TPageRequest = PageRequest
export type TPageResponse<T> = PageResponse<T>
export type TResponseError = ResponseError
export type TClientResponse<T> = ClientResponse<T>

export type TCreateApiKey = z.infer<typeof CreateApiKeySchema>
export type TUpdateApiKey = z.infer<typeof UpdateApiKeySchema>

// Export types from auth.types.ts with T prefix
export type TResendOTPRequest = ResendOTPRequest
export type TResendOTPResponse = ResendOTPResponse

export type TCreateEnvironment = z.infer<typeof CreateEnvironmentSchema>
export type TUpdateEnvironment = z.infer<typeof UpdateEnvironmentSchema>

export type TCreateIntegration = z.infer<typeof CreateIntegrationSchema>
export type TUpdateIntegration = z.infer<typeof UpdateIntegrationSchema>

export type TCreateProject = z.infer<typeof CreateProjectSchema>
export type TUpdateProject = z.infer<typeof UpdateProjectSchema>
export type TForkProject = z.infer<typeof ForkProjectSchema>

export type TCreateSecret = z.infer<typeof CreateSecretSchema>
export type TUpdateSecret = z.infer<typeof UpdateSecretSchema>

export type TCreateVariable = z.infer<typeof CreateVariableSchema>
export type TUpdateVariable = z.infer<typeof UpdateVariableSchema>

// Export types from workspace.types.ts with T prefix
export type TWorkspace = Workspace
export type TCreateWorkspaceRequest = CreateWorkspaceRequest
export type TCreateWorkspaceResponse = CreateWorkspaceResponse
export type TUpdateWorkspaceRequest = UpdateWorkspaceRequest
export type TUpdateWorkspaceResponse = UpdateWorkspaceResponse
export type TDeleteWorkspaceRequest = DeleteWorkspaceRequest
export type TDeleteWorkspaceResponse = DeleteWorkspaceResponse
export type TGetWorkspaceRequest = GetWorkspaceRequest
export type TGetWorkspaceResponse = GetWorkspaceResponse
export type TGetAllWorkspacesOfUserRequest = GetAllWorkspacesOfUserRequest
export type TGetAllWorkspacesOfUserResponse = GetAllWorkspacesOfUserResponse
export type TExportDataRequest = ExportDataRequest
export type TExportDataResponse = ExportDataResponse
export type TGlobalSearchRequest = GlobalSearchRequest
export type TGlobalSearchResponse = GlobalSearchResponse

export type TCreateWorkspaceRole = z.infer<typeof CreateWorkspaceRoleSchema>
export type TUpdateWorkspaceRole = z.infer<typeof UpdateWorkspaceRoleSchema>
