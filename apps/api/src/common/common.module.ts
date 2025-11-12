import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './logger.service'
import { TierLimitService } from './tier-limit.service'
import SlugGenerator from './slug-generator.service'
import { HydrationService } from './hydration.service'
import { TokenService } from '@/common/token.service'
import { MetricService } from './metrics.service'

@Global()
@Module({
  imports: [],
  providers: [
    CustomLoggerService,
    TierLimitService,
    SlugGenerator,
    HydrationService,
    TokenService,
    MetricService
  ],
  exports: [
    CustomLoggerService,
    TierLimitService,
    SlugGenerator,
    HydrationService,
    TokenService,
    MetricService
  ]
})
export class CommonModule {}
