import { WorkspaceRole } from '@prisma/client'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateWorkspace {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string
}
