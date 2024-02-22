import { IsNumber, IsOptional, IsString, Length } from 'class-validator'

export class CreateSecret {
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

  @IsString()
  @IsOptional()
  rotateAfter: '24' | '168' | '720' | '8760' | 'never' = 'never'
}
