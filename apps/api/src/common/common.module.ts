import { Global, Module } from '@nestjs/common'
import { AuthorityCheckerService } from './authority-checker.service'
import { CustomLoggerService } from './logger.service'
import JobHandler from './job.handler'

@Global()
@Module({
  imports: [],
  providers: [AuthorityCheckerService, CustomLoggerService, JobHandler],
  exports: [AuthorityCheckerService, CustomLoggerService, JobHandler]
})
export class CommonModule {}
