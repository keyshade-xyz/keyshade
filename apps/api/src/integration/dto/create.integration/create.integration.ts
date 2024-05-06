import {
  Environment,
  EventType,
  IntegrationType,
  Project
} from '@prisma/client'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString
} from 'class-validator'

export class CreateIntegration {
  @IsString()
  name: string

  @IsEnum(IntegrationType)
  type: IntegrationType

  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  notifyOn?: EventType[]

  @IsString()
  @IsOptional()
  environmentId?: Environment['id']

  @IsString()
  @IsOptional()
  projectId?: Project['id']

  @IsObject()
  metadata: Record<string, string>
}
