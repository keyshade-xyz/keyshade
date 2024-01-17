import { ApiKey, ApiKeyGeneralRole, ApiKeyWorkspaceScope } from '@prisma/client'
import { IsArray, IsOptional, IsString } from 'class-validator'

export class CreateApiKey {
  @IsString()
  name: ApiKey['name']

  @IsString()
  expiresAfter: '24' | '168' | '720' | '8760' | 'never' = 'never'

  @IsArray()
  generalRoles: ApiKeyGeneralRole[]

  @IsArray()
  @IsOptional()
  scopes: ApiKeyWorkspaceScope[]
}
