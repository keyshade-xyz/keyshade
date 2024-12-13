import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'

export class CreateEnvironment {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string
}
