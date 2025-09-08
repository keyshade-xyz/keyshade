import { Share } from '@prisma/client'

export interface ShareResponse {
  id: Share['id']
  hash: Share['hash']
  secret: Share['secret']
  mediaKeys: Share['mediaKeys']
  isText: Share['isText']
  note: Share['note']
  expiresAt: Share['expiresAt']
  isPasswordProtected: Share['isPasswordProtected']
}
