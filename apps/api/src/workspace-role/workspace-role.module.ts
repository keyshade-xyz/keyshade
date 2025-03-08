import { Module } from '@nestjs/common'
import { WorkspaceRoleService } from './workspace-role.service'
import { WorkspaceRoleController } from './workspace-role.controller'

@Module({
  imports: [],
  providers: [WorkspaceRoleService],
  controllers: [WorkspaceRoleController]
})
export class WorkspaceRoleModule {}
