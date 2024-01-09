import { Module } from '@nestjs/common'
import { EnvironmentController } from './controller/environment.controller'
import { EnvironmentService } from './service/environment.service'
import { ENVIRONMENT_REPOSITORY } from './repository/interface.repository'
import { EnvironmentRepository } from './repository/environment.repository'
import { PROJECT_REPOSITORY } from '../project/repository/interface.repository'
import { ProjectRepository } from '../project/repository/project.repository'
import { ProjectPermission } from '../project/misc/project.permission'

@Module({
  controllers: [EnvironmentController],
  exports: [
    {
      provide: ENVIRONMENT_REPOSITORY,
      useClass: EnvironmentRepository
    }
  ],
  providers: [
    EnvironmentService,
    {
      provide: ENVIRONMENT_REPOSITORY,
      useClass: EnvironmentRepository
    },
    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository
    },
    ProjectPermission
  ]
})
export class EnvironmentModule {}
