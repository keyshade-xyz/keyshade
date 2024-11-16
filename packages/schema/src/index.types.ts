import { z } from 'zod'
import { CreateApiKeySchema, UpdateApiKeySchema } from './api-key'
import { CreateIntegrationSchema, UpdateIntegrationSchema } from './integration'
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

// Export types from environment.types.ts
export * from './environment/environment.types'

export type TCreateIntegration = z.infer<typeof CreateIntegrationSchema>
export type TUpdateIntegration = z.infer<typeof UpdateIntegrationSchema>

// Export types from project.types.ts
export * from './project/project.types'

export type TCreateSecret = z.infer<typeof CreateSecretSchema>
export type TUpdateSecret = z.infer<typeof UpdateSecretSchema>

export type TCreateVariable = z.infer<typeof CreateVariableSchema>
export type TUpdateVariable = z.infer<typeof UpdateVariableSchema>

// Export types from workspace.types.ts
export * from './workspace/workspace.types'

export type TCreateWorkspaceRole = z.infer<typeof CreateWorkspaceRoleSchema>
export type TUpdateWorkspaceRole = z.infer<typeof UpdateWorkspaceRoleSchema>
