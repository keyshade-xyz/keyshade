import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator'
import { IsASCII } from '@/decorators/validation.decorator'

export class CreateUserDto {
  @IsString()
  @IsASCII()
  @IsOptional()
  name?: string

  @IsString()
  @IsEmail()
  email: string

  @IsString()
  @IsOptional()
  profilePictureUrl?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsBoolean()
  @IsOptional()
  isOnboardingFinished?: boolean

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean
}
