import { Authority } from '@prisma/client'
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator'

export class CreateWorkspaceRole {
  @IsString()
  readonly name: string

  @IsString()
  @IsOptional()
  readonly description?: string

  @IsString()
  @IsOptional()
  readonly colorCode?: string

  @IsArray()
  @IsOptional()
  readonly authorities?: Authority[]

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  readonly projectEnvironments?: ProjectEnvironments[]
}

class ProjectEnvironments {
  @IsString()
  @IsNotEmpty()
  readonly projectSlug: string

  @IsArray()
  @IsNotEmpty({ each: true })
  readonly environmentSlugs: string[]
}
