import { WorkspaceRole } from '@prisma/client'
import { IsArray, IsNotEmpty, IsString } from 'class-validator'

export class CreateWorkspaceMember {
  @IsString()
  @IsNotEmpty()
  email: string

  @IsArray()
  @IsString()
  roleSlugs: WorkspaceRole['slug'][]
}
