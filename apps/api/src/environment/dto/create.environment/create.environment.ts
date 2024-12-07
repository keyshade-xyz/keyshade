import {IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateEnvironment {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string
}
