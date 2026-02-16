import { EventType, Environment } from '@prisma/client'
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString
} from 'class-validator'
import { IsName } from '@/decorators/validation.decorator'

export class UpdateIntegration {
  @IsString()
  @IsName()
  @IsOptional()
  name?: string

  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  notifyOn?: EventType[]

  @IsArray()
  @IsOptional()
  environmentSlugs?: Environment['slug'][]

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}
