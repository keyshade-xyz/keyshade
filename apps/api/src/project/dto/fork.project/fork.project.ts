import { Workspace } from '@prisma/client'
import { IsOptional, IsString } from 'class-validator'

export class ForkProject {
  @IsString()
  @IsOptional()
  workspaceSlug?: Workspace['slug']

  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  storePrivateKey?: boolean
}
