import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateSecret {
  @IsString()
  name: string

  @IsString()
  value: string

  @IsNumber()
  @IsOptional()
  environmentId: string

  @IsString()
  @IsOptional()
  rotateAfter: '24' | '168' | '720' | '8760' | 'never' = 'never'
}
