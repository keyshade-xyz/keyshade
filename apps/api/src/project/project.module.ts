import { Module } from '@nestjs/common'
import { ProjectService } from './service/project.service'
import { ProjectController } from './controller/project.controller'
import { EnvironmentModule } from '../environment/environment.module'
import { UserModule } from '../user/user.module'
import { SecretModule } from '../secret/secret.module'
import { WorkspacePermission } from '../workspace/misc/workspace.permission'

@Module({
  providers: [ProjectService, WorkspacePermission],
  controllers: [ProjectController],
  imports: [UserModule, EnvironmentModule, SecretModule]
})
export class ProjectModule {}
