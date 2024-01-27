import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @IsOptional()
  name: string
  @IsString()
  email: string
  @IsString()
  @IsOptional()
  profilePictureUrl: string
  @IsBoolean()
  @IsOptional()
  isActive: boolean
  @IsBoolean()
  @IsOptional()
  isOnboardingFinished: boolean
  @IsBoolean()
  @IsOptional()
  isAdmin: boolean
}
