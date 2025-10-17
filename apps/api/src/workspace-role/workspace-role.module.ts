import { Module } from '@nestjs/common'
import { WorkspaceRoleService } from './workspace-role.service'
import { WorkspaceRoleController } from './workspace-role.controller'
import { ProjectCacheService } from '@/cache/project-cache.service'

@Module({
  imports: [],
  providers: [WorkspaceRoleService, ProjectCacheService],
  controllers: [WorkspaceRoleController]
})
export class WorkspaceRoleModule {}
