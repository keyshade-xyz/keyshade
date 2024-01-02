import { Module } from '@nestjs/common'
import { ProjectService } from './service/project.service'
import { ProjectController } from './controller/project.controller'
import { ProjectRepository } from './repository/project.repository'
import { PROJECT_REPOSITORY } from './repository/interface.repository'
import { ProjectPermission } from './misc/project.permission'
import { EnvironmentModule } from '../environment/environment.module'
import { UserModule } from '../user/user.module'

@Module({
  providers: [
    ProjectService,
    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository
    },
    ProjectPermission
  ],
  controllers: [ProjectController],
  imports: [UserModule, EnvironmentModule]
})
export class ProjectModule {}
