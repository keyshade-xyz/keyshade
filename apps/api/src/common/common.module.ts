import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './logger.service'
import { TierLimitService } from './tier-limit.service'

@Global()
@Module({
  imports: [],
  providers: [CustomLoggerService, TierLimitService],
  exports: [CustomLoggerService, TierLimitService]
})
export class CommonModule {}
