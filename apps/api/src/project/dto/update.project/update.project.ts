import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { CreateProject } from '../create.project/create.project'
import { PartialType } from '@nestjs/swagger'

export class UpdateProject extends PartialType(CreateProject) {
  @IsBoolean()
  @IsOptional()
  regenerateKeyPair?: boolean

  @IsString()
  @IsOptional()
  privateKey?: string
}
