import { ApiKey, Authority } from '@prisma/client'
import { IsArray, IsOptional, IsString } from 'class-validator'

export class CreateApiKey {
  @IsString()
  name: ApiKey['name']

  @IsString()
  @IsOptional()
  expiresAfter?: '24' | '168' | '720' | '8760' | 'never' = 'never'

  @IsArray()
  @IsOptional()
  authorities?: Authority[] = []
}
