import { PartialType } from '@nestjs/swagger'
import { CreateWorkspaceRole } from '../create-workspace-role/create-workspace-role'

export class UpdateWorkspaceRole extends PartialType(CreateWorkspaceRole) {}
