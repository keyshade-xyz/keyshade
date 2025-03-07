import { Authority } from '@prisma/client'
import { AuthenticatedUser } from '@/user/user.types'

export interface AuthorizationParams {
  user: AuthenticatedUser
  authorities: Authority[]
  entity: { slug?: string; name?: string }
}
