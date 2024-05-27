import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class CreateEnvironment {
  @IsString()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean
}
