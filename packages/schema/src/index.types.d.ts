import { z } from 'zod'
import { CreateApiKeySchema, UpdateApiKeySchema } from './api-key'
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
  CreateWorkspaceSchema,
  InviteMemberSchema,
  UpdateWorkspaceSchema
} from './workspace'
import {
  CreateWorkspaceRoleSchema,
  UpdateWorkspaceRoleSchema
} from './workspace-role'

export type TCreateApiKey = z.infer<typeof CreateApiKeySchema>
export type TUpdateApiKey = z.infer<typeof UpdateApiKeySchema>

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

export type TCreateWorkspace = z.infer<typeof CreateWorkspaceSchema>
export type TUpdateWorkspace = z.infer<typeof UpdateWorkspaceSchema>
export type TInviteMember = z.infer<typeof InviteMemberSchema>

export type TCreateWorkspaceRole = z.infer<typeof CreateWorkspaceRoleSchema>
export type TUpdateWorkspaceRole = z.infer<typeof UpdateWorkspaceRoleSchema>
