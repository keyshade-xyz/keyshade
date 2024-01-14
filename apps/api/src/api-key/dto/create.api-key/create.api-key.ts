import { ApiKey, ApiKeyGeneralRole, ProjectScope } from '@prisma/client'
import { IsString } from 'class-validator'

export class CreateApiKey {
  @IsString()
  name: ApiKey['name']

  @IsString()
  expiresAfter: '1d' | '7d' | '30d' | '90d' | '365d' | 'never'

  generalRoles: ApiKeyGeneralRole[]

  scopes: ProjectScope[]
}
