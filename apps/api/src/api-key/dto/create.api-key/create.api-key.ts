import { ApiKey, ApiKeyGeneralRole, ProjectScope } from '@prisma/client'
import { IsString } from 'class-validator'

export class CreateApiKey {
  @IsString()
  name: ApiKey['name']

  @IsString()
  expiresAfter: '24' | '168' | '720' | '8760' | 'never' = 'never'

  generalRoles: ApiKeyGeneralRole[]

  scopes: ProjectScope[]
}
