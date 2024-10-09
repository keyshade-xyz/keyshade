import { Global, Module } from '@nestjs/common'
import { AuthorityCheckerService } from './authority-checker.service'
import { CustomLoggerService } from './logger.service'

@Global()
@Module({
  imports: [],
  providers: [AuthorityCheckerService, CustomLoggerService],
  exports: [AuthorityCheckerService, CustomLoggerService]
})
export class CommonModule {}
