import { AuthenticatedUser, UserWithWorkspace } from '@/user/user.types'
import { Authority, User, Workspace } from '@prisma/client'

export interface UserAuthenticatedResponse extends UserWithWorkspace {
  token: string
}

export type AuthenticatedUserContext = User & {
  ipAddress: string
  isAuthViaApiKey?: boolean
  apiKeyAuthorities?: Set<Authority>
  defaultWorkspace: Workspace
}

export interface AuthorizationParams {
  user: AuthenticatedUser
  authorities: Authority[]
  slug: string
}
