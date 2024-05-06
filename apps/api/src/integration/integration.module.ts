import { Module } from '@nestjs/common'
import { IntegrationService } from './service/integration.service'
import { IntegrationController } from './controller/integration.controller'

@Module({
  providers: [IntegrationService],
  controllers: [IntegrationController]
})
export class IntegrationModule {}
