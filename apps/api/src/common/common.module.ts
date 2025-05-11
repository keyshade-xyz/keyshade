import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './logger.service'
import { TierLimitService } from './tier-limit.service'
import SlugGenerator from './slug-generator.service'

@Global()
@Module({
  imports: [],
  providers: [CustomLoggerService, TierLimitService, SlugGenerator],
  exports: [CustomLoggerService, TierLimitService, SlugGenerator]
})
export class CommonModule {}
