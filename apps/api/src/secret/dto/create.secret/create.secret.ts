import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateSecret {
  @IsString()
  name: string

  @IsString()
  value: string

  @IsNumber()
  @IsOptional()
  environmentId: string
}
