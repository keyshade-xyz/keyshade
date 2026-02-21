import { WorkspaceRole } from '@prisma/client'
import { IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class CreateWorkspaceMember {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsArray()
  @IsString({ each: true })
  roleSlugs: WorkspaceRole['slug'][]
}
