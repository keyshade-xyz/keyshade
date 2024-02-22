import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateVariable {
  @IsString()
  name: string

  @IsString()
  value: string

  @IsString()
  @IsOptional()
  note: string

  @IsNumber()
  @IsOptional()
  environmentId: string
}
