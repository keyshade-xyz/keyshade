import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './logger.service'
import { TierLimitService } from './tier-limit.service'
import SlugGenerator from './slug-generator.service'
import { HydrationService } from './hydration.service'

@Global()
@Module({
  imports: [],
  providers: [
    CustomLoggerService,
    TierLimitService,
    SlugGenerator,
    HydrationService
  ],
  exports: [
    CustomLoggerService,
    TierLimitService,
    SlugGenerator,
    HydrationService
  ]
})
export class CommonModule {}
