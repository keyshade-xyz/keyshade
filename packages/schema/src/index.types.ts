import { z } from 'zod'
import { CreateApiKeySchema, UpdateApiKeySchema } from './api-key'
import { CreateIntegrationSchema, UpdateIntegrationSchema } from './integration'
import {
  CreateWorkspaceRoleSchema,
  UpdateWorkspaceRoleSchema
} from './workspace-role'

export * from './pagination/index.types'
export * from './auth/index.types'
export * from './environment/index.types'
export * from './project/index.types'
export * from './secret/index.types'
export * from './user/index.types'
export * from './workspace/index.types'
export * from './variable/index.types'

export type TCreateApiKey = z.infer<typeof CreateApiKeySchema>
export type TUpdateApiKey = z.infer<typeof UpdateApiKeySchema>

export type TCreateIntegration = z.infer<typeof CreateIntegrationSchema>
export type TUpdateIntegration = z.infer<typeof UpdateIntegrationSchema>

export type TCreateWorkspaceRole = z.infer<typeof CreateWorkspaceRoleSchema>
export type TUpdateWorkspaceRole = z.infer<typeof UpdateWorkspaceRoleSchema>
