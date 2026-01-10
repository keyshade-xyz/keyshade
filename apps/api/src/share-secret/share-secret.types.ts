import { Share } from '@prisma/client'

export interface ShareResponse {
  id: Share['id']
  hash: Share['hash']
  secret: Share['secret']
  expiresAt: Share['expiresAt']
  isPasswordProtected: Share['isPasswordProtected']
}
