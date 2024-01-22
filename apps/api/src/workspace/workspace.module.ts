import { Module } from '@nestjs/common'
import { WorkspaceService } from './service/workspace.service'
import { WorkspaceController } from './controller/workspace.controller'
import { WorkspacePermission } from './misc/workspace.permission'

@Module({
  providers: [WorkspaceService, WorkspacePermission],
  controllers: [WorkspaceController],
  exports: [WorkspacePermission]
})
export class WorkspaceModule {}
