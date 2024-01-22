import { Module } from '@nestjs/common'
import { EnvironmentController } from './controller/environment.controller'
import { EnvironmentService } from './service/environment.service'

@Module({
  controllers: [EnvironmentController],
  exports: [],
  providers: [EnvironmentService]
})
export class EnvironmentModule {}
