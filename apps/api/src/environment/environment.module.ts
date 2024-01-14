import { Module } from '@nestjs/common'
import { EnvironmentController } from './controller/environment.controller'
import { EnvironmentService } from './service/environment.service'
import { PROJECT_REPOSITORY } from '../project/repository/interface.repository'
import { ProjectRepository } from '../project/repository/project.repository'
import { ProjectPermission } from '../project/misc/project.permission'

@Module({
  controllers: [EnvironmentController],
  exports: [],
  providers: [
    EnvironmentService,
    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository
    },
    ProjectPermission
  ]
})
export class EnvironmentModule {}
