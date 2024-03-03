import { WorkspaceRole } from '@prisma/client'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateWorkspace {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description: string

  @IsBoolean()
  @IsOptional()
  approvalEnabled: boolean
}

export interface WorkspaceMemberDTO {
  email: string
  roleIds: WorkspaceRole['id'][]
}
