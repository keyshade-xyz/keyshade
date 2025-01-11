import { Authority } from '@prisma/client'
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'

class ProjectEnvironments {
  @IsString()
  @IsNotEmpty()
  readonly projectSlug: string

  @IsArray()
  @IsOptional()
  @IsNotEmpty({ each: true })
  readonly environmentSlugs?: string[]
}

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
  @Type(() => ProjectEnvironments)
  readonly projectEnvironments?: ProjectEnvironments[]
}
