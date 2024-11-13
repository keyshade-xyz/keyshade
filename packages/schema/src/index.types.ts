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
  CreateWorkspaceRoleSchema,
  UpdateWorkspaceRoleSchema
} from './workspace-role'

//Export types from pagination.types.ts
export * from './pagination/pagination.types'

export type TCreateApiKey = z.infer<typeof CreateApiKeySchema>
export type TUpdateApiKey = z.infer<typeof UpdateApiKeySchema>

// Export types from auth.types.ts
export * from './auth/auth.types'

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

// Export types from workspace.types.ts
export * from './workspace/workspace.types'

export type TCreateWorkspaceRole = z.infer<typeof CreateWorkspaceRoleSchema>
export type TUpdateWorkspaceRole = z.infer<typeof UpdateWorkspaceRoleSchema>
