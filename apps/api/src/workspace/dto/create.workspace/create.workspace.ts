import { WorkspaceRole } from '@prisma/client'
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateWorkspace {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description: string

  @IsArray()
  @IsOptional()
  members: WorkspaceMemberDTO[]
}

export interface WorkspaceMemberDTO {
  email: string
  role: WorkspaceRole
}
