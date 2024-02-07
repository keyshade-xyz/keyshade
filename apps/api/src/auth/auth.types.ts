import { Authority, User } from '@prisma/client'

export type UserAuthenticatedResponse = User & {
  token: string
}

export type AuthenticatedUserContext = User & {
  isAuthViaApiKey?: boolean
  apiKeyAuthorities?: Set<Authority>
}
