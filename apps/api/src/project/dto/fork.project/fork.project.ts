import { Workspace } from '@prisma/client'
import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class ForkProject {
  @IsString()
  @IsOptional()
  workspaceSlug?: Workspace['slug']

  @IsString()
  @IsOptional()
  name?: string

  @IsBoolean()
  @IsOptional()
  storePrivateKey?: boolean
}
