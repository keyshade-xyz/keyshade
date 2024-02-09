import { Module } from '@nestjs/common'
import { WorkspaceService } from './service/workspace.service'
import { WorkspaceController } from './controller/workspace.controller'

@Module({
  providers: [WorkspaceService],
  controllers: [WorkspaceController]
})
export class WorkspaceModule {}
