import { User, Workspace } from '@prisma/client'

export interface UserWithWorkspace extends User {
  defaultWorkspace: Workspace
}

export interface AuthenticatedUser extends User {
  ipAddress: string
}

export interface PersonalAccessTokenResponse {
  id: string
  token?: string // Will be set only when the token is generated for the first time, and when regenerated
  name: string
  createdAt: Date
  updatedAt: Date
  expiresOn: Date | null
  lastUsedOn: Date | null
}
