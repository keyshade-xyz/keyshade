import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    name: 'name',
    description: 'Full name of the user',
    required: false,
    type: String,
    example: 'John Doe',
    default: null
  })
  name: string

  @IsString()
  @ApiProperty({
    name: 'email',
    description: 'Email of the user',
    required: true,
    type: String,
    example: 'johndoe@keyshade.xyz',
    format: 'email',
    uniqueItems: true
  })
  email: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    name: 'profilePictureUrl',
    description: 'URL of the user profile picture',
    required: false,
    type: String,
    example: 'https://example.com/profile.jpg',
    default: null
  })
  profilePictureUrl: string

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    name: 'isActive',
    description: 'Is the user active',
    required: false,
    type: Boolean,
    example: true,
    default: true
  })
  isActive: boolean

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    name: 'isOnboardingFinished',
    description: 'Is the user onboarding finished',
    required: false,
    type: Boolean,
    example: true,
    default: false
  })
  isOnboardingFinished: boolean

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    name: 'isAdmin',
    description: 'Is the user an admin',
    required: false,
    type: Boolean,
    example: false,
    default: false
  })
  isAdmin: boolean
}
