import {
  ApiKey,
  ApiKeyProjectRole,
  Project,
  ProjectScope
} from '@prisma/client'

export interface Scope {
  projectId: Project['id']
  roles: ApiKeyProjectRole[]
}

export interface ApiKeyWithProjectScopes extends Partial<ApiKey> {
  projectScopes: ProjectScope[]
}
