import { Module } from '@nestjs/common'
import { EnvironmentController } from './environment.controller'
import { EnvironmentService } from './environment.service'

@Module({
  controllers: [EnvironmentController],
  exports: [],
  providers: [EnvironmentService]
})
export class EnvironmentModule {}
