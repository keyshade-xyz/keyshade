import { ApiProperty } from '@nestjs/swagger'
import { ApiKey, Authority } from '@prisma/client'
import { IsArray, IsOptional, IsString } from 'class-validator'

export class CreateApiKey {
  @IsString()
  @ApiProperty({
    name: 'name',
    description: 'Name of the API key',
    required: true,
    type: String,
    example: 'My API Key'
  })
  name: ApiKey['name']

  @IsString()
  @IsOptional()
  @ApiProperty({
    name: 'expiresAfter',
    description: 'API key expiration time in hours',
    required: false,
    type: String,
    example: '24',
    default: 'never'
  })
  expiresAfter?: '24' | '168' | '720' | '8760' | 'never' = 'never'

  @IsArray()
  @IsOptional()
  @ApiProperty({
    name: 'authorities',
    description: 'API key authorities',
    required: false,
    type: [String],
    example: ['READ_SELF', 'UPDATE_SELF'],
    default: []
  })
  authorities?: Authority[] = []
}
