import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './logger.service'

@Global()
@Module({
  imports: [],
  providers: [CustomLoggerService],
  exports: [CustomLoggerService]
})
export class CommonModule {}
