import { PartialType } from '@nestjs/swagger'
import { CreateUserDto } from '../create.user/create.user'
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class EmailPreferencesDto {
  @IsOptional()
  @IsBoolean()
  marketing?: boolean

  @IsOptional()
  @IsBoolean()
  activity?: boolean

  @IsOptional()
  @IsBoolean()
  critical?: boolean
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailPreferencesDto)
  emailPreferences?: EmailPreferencesDto
}
