import { ProjectAccessLevel } from '@prisma/client'
import { CreateEnvironment } from '../../../environment/dto/create.environment/create.environment'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator'
import { IsName, IsDescriptive } from '@/decorators/validation.decorator'

export class CreateProject {
  @IsString()
  @IsName()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsDescriptive()
  @IsOptional()
  description?: string

  @IsBoolean()
  @IsOptional()
  storePrivateKey?: boolean

  @IsArray()
  @IsOptional()
  environments?: CreateEnvironment[]

  @IsEnum(ProjectAccessLevel)
  @IsOptional()
  accessLevel?: ProjectAccessLevel
}
