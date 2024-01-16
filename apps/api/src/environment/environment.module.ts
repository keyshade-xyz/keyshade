import { Module } from '@nestjs/common'
import { EnvironmentController } from './controller/environment.controller'
import { EnvironmentService } from './service/environment.service'
import { ProjectPermission } from '../project/misc/project.permission'

@Module({
  controllers: [EnvironmentController],
  exports: [],
  providers: [EnvironmentService, ProjectPermission]
})
export class EnvironmentModule {}
