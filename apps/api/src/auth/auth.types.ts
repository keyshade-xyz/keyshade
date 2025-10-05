import { AuthenticatedUser, UserWithWorkspace } from '@/user/user.types'
import { Authority, User, Workspace } from '@prisma/client'

export interface UserAuthenticatedResponse extends UserWithWorkspace {
  token: string
  cliSessionId?: string
}

export enum ActorType {
  USER = 'USER',
  SERVICE_ACCOUNT = 'SERVICE_ACCOUNT'
}

export type AuthenticatedUserContext = User & {
  ipAddress: string
  actorType: ActorType
  defaultWorkspace: Workspace
}

export interface AuthorizationParams {
  user: AuthenticatedUser
  authorities: Authority[]
  slug: string
}

export interface DeviceDetail {
  ipAddress: string
  encryptedIpAddress: string
  os: string
  platform: string
  city: string
  region: string
  country: string
}
