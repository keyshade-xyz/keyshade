import { PartialType } from '@nestjs/swagger'
import { CreateSecret } from '../create.secret/create.secret'
import { IsOptional, IsString } from 'class-validator'
export class UpdateSecret extends PartialType(CreateSecret) {
  @IsString()
  @IsOptional()
  privateKey?: string
}
