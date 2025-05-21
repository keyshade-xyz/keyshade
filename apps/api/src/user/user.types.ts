import { EmailPreference, User, Workspace } from '@prisma/client'

export interface UserWithWorkspace extends User {
  defaultWorkspace: Workspace
  emailPreference: EmailPreference
}

export interface AuthenticatedUser extends User {
  ipAddress: string
}
