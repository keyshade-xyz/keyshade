import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './logger.service'
import { TierLimitService } from './tier-limit.service'
import SlugGenerator from './slug-generator.service'
import { EntitlementService } from './entitlement.service'

@Global()
@Module({
  imports: [],
  providers: [
    CustomLoggerService,
    TierLimitService,
    SlugGenerator,
    EntitlementService
  ],
  exports: [
    CustomLoggerService,
    TierLimitService,
    SlugGenerator,
    EntitlementService
  ]
})
export class CommonModule {}
