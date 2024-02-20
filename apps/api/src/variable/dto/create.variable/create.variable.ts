import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateVariable {
  @IsString()
  name: string

  @IsString()
  value: string

  @IsNumber()
  @IsOptional()
  environmentId: string
}
