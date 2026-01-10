import { Module } from '@nestjs/common'
import { IntegrationService } from './integration.service'
import { IntegrationController } from './integration.controller'
import { VercelIntegration } from './plugins/vercel.integration'

@Module({
  providers: [IntegrationService, VercelIntegration],
  controllers: [IntegrationController]
})
export class IntegrationModule {}
