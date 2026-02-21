import { ArrayMinSize, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CreateWorkspaceMember } from '../create.workspace/create.workspace-membership'

export class BulkInviteUsersDto {
  @ValidateNested({ each: true })
  @Type(() => CreateWorkspaceMember)
  @ArrayMinSize(1)
  members: CreateWorkspaceMember[]
}
