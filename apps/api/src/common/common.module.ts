import { Global, Module } from '@nestjs/common'
import { AuthorityCheckerService } from './authority-checker.service'
import { CustomLoggerService } from './logger.service'
import JobHandlerService from './job.handler'

@Global()
@Module({
  imports: [],
  providers: [AuthorityCheckerService, CustomLoggerService, JobHandlerService],
  exports: [AuthorityCheckerService, CustomLoggerService, JobHandlerService]
})
export class CommonModule {}
