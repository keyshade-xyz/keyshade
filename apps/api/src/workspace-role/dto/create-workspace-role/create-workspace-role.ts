import { Authority } from '@prisma/client'
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  Matches
} from 'class-validator'
import { Type } from 'class-transformer'
import { IsASCII, IsDescriptive } from '@/decorators/validation.decorator'

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
  @IsASCII()
  readonly name: string

  @IsString()
  @IsOptional()
  @IsDescriptive()
  readonly description?: string

  @IsString()
  @Matches(/^#?[0-9A-Fa-f]{6}$/)
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
