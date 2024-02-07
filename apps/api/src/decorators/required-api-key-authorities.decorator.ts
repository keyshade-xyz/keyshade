import { SetMetadata } from '@nestjs/common'
import { Authority } from '@prisma/client'

export const REQUIRED_API_KEY_AUTHORITIES = 'required-api-key-authority'

export const RequiredApiKeyAuthorities = (...authorities: Authority[]) =>
  SetMetadata(REQUIRED_API_KEY_AUTHORITIES, authorities)
