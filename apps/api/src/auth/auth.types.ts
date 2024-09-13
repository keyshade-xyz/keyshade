import { UserWithWorkspace } from '@/user/user.types'
import { Authority, User, Workspace } from '@prisma/client'

export interface UserAuthenticatedResponse extends UserWithWorkspace {
  token: string
}

export type AuthenticatedUserContext = User & {
  isAuthViaApiKey?: boolean
  apiKeyAuthorities?: Set<Authority>
  defaultWorkspace: Workspace
}
