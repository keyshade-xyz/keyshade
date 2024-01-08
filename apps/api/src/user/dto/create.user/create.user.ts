import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class ICreateUserDto {
  @IsString()
  name: string
  @IsString()
  email: string
  @IsString()
  @IsOptional()
  profilePictureUrl: string
  @IsBoolean()
  isActive: boolean
  @IsBoolean()
  isOnboardingFinished: boolean
  @IsBoolean()
  isAdmin: boolean
}
