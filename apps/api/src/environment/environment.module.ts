import { Module } from '@nestjs/common'
import { EnvironmentController } from './controller/environment.controller'
import { EnvironmentService } from './service/environment.service'
import { ENVIRONMENT_REPOSITORY } from './repository/interface.repository'
import { EnvironmentRepository } from './repository/environment.repository'

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
    }
  ]
})
export class EnvironmentModule {}
