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

export class CreateProject {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
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
