import { Workspace } from '@prisma/client'
import { IsOptional, IsString } from 'class-validator'

export class ForkProject {
  @IsString()
  @IsOptional()
  workspaceId?: Workspace['id']

  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  storePrivateKey?: boolean
}
