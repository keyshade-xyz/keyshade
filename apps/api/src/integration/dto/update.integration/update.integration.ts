import { EventType, Environment } from '@prisma/client'
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString
} from 'class-validator'

export class UpdateIntegration {
  @IsString()
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
  metadata?: Record<string, string>
}
