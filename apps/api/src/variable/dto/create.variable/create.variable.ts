import { IsNumber, IsOptional, IsString, Length } from 'class-validator'

export class CreateVariable {
  @IsString()
  name: string

  @IsString()
  value: string

  @IsString()
  @IsOptional()
  @Length(0, 100)
  note: string

  @IsNumber()
  @IsOptional()
  environmentId: string
}
