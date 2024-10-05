import { Global, Module } from '@nestjs/common'
import { AuthorityCheckerService } from './authority-checker.service'
import { CustomLoggerService } from './logger.service'
import { JobHandlerService } from './job.handler'

@Global()
@Module({
  imports: [],
  providers: [
    AuthorityCheckerService,
    CustomLoggerService,
    JobHandlerService,
    {
      provide: 'DATABASE_CONNECTION_STRING',
      useValue: process.env.DATABASE_URL
    }
  ],
  exports: [AuthorityCheckerService, CustomLoggerService, JobHandlerService]
})
export class CommonModule {}
