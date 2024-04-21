import { Module } from '@nestjs/common'
import { WorkspaceRoleService } from './service/workspace-role.service'
import { WorkspaceRoleController } from './controller/workspace-role.controller'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [CommonModule],
  providers: [WorkspaceRoleService],
  controllers: [WorkspaceRoleController]
})
export class WorkspaceRoleModule {}
