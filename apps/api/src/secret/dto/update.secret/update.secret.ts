import { PartialType } from '@nestjs/swagger'
import { CreateSecret } from '../create.secret/create.secret'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
export class UpdateSecret extends PartialType(CreateSecret) {
  @IsBoolean()
  @IsOptional()
  decryptValue?: boolean

  @IsString()
  @IsOptional()
  privateKey?: string
}
