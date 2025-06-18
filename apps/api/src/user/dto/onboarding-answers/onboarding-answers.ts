import { IsOptional, IsString } from 'class-validator'

export class OnboardingAnswersDto {
  @IsString()
  name: string

  @IsString()
  @IsOptional()
  profilePictureUrl?: string

  @IsString()
  @IsOptional()
  role?: string

  @IsString()
  @IsOptional()
  industry?: string

  @IsString()
  @IsOptional()
  teamSize?: string

  @IsString()
  @IsOptional()
  productStage?: string

  @IsString()
  @IsOptional()
  useCase?: string

  @IsString()
  @IsOptional()
  heardFrom?: string

  @IsString()
  @IsOptional()
  wouldLikeToRefer?: string

  @IsString()
  @IsOptional()
  referralCode?: string
}
