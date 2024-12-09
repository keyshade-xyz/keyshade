import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'

export class CreateEnvironment {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9-_]{1,64}$/)
  name: string

  @IsString()
  @IsOptional()
  description?: string
}
