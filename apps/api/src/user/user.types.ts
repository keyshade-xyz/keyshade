import { User, Workspace } from '@prisma/client'

export interface UserWithWorkspace extends User {
  defaultWorkspace: Workspace
}
