import { Module } from '@nestjs/common'
import { WorkspaceService } from './workspace.service'
import { WorkspaceController } from './workspace.controller'

@Module({
  providers: [WorkspaceService],
  controllers: [WorkspaceController]
})
export class WorkspaceModule {}
