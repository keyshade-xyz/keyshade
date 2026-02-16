import { IsOptional, IsString, IsAlphanumeric } from 'class-validator'
import {
  IsNameWithSlash,
  IsName,
  IsTeamSize,
  IsDescriptive
} from '@/decorators/validation.decorator'

export class OnboardingAnswersDto {
  @IsString()
  @IsName()
  name: string

  @IsString()
  @IsOptional()
  profilePictureUrl?: string

  @IsString()
  @IsNameWithSlash()
  @IsOptional()
  role?: string

  @IsString()
  @IsName()
  @IsOptional()
  industry?: string

  @IsString()
  @IsTeamSize()
  @IsOptional()
  teamSize?: string

  @IsString()
  @IsName()
  @IsOptional()
  productStage?: string

  @IsString()
  @IsDescriptive()
  @IsOptional()
  useCase?: string

  @IsString()
  @IsName()
  @IsOptional()
  heardFrom?: string

  @IsString()
  @IsAlphanumeric()
  @IsOptional()
  referralCode?: string
}
