import { PartialType } from '@nestjs/swagger'
import { CreateApiKey } from '../create.api-key/create.api-key'
import { IsOptional } from 'class-validator'
import { ProjectScope } from '@prisma/client'

export class UpdateApiKey extends PartialType(CreateApiKey) {
  @IsOptional()
  projectToAdd: ProjectScope[]

  @IsOptional()
  projectToRemove: ProjectScope['id'][]

  @IsOptional()
  projectToUpdate: ProjectScope[]
}
