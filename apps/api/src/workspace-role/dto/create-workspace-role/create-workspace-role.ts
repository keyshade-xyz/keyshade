import { Authority } from '@prisma/client'
import { IsArray, IsOptional, IsString } from 'class-validator'

export class CreateWorkspaceRole {
  @IsString()
  readonly name: string

  @IsString()
  @IsOptional()
  readonly description: string

  @IsString()
  @IsOptional()
  readonly colorCode: string

  @IsArray()
  @IsOptional()
  readonly authorities: Authority[]

  @IsArray()
  @IsOptional()
  readonly projectIds: string[]
}
