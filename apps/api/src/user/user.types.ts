import { User, Workspace } from '@prisma/client'
import { DeviceDetail } from '@/auth/auth.types'

export interface UserWithWorkspace extends User {
  defaultWorkspace: Workspace
}

export interface AuthenticatedUser extends User {
  ipAddress: string
}

export interface PersonalAccessTokenResponse {
  id: string
  token: string
  createdAt: Date
  updatedAt: Date
  expiresOn?: Date
  lastUsedOn: Date
  deviceDetail: DeviceDetail
}
