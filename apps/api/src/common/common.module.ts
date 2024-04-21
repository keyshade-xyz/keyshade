import { Global, Module } from '@nestjs/common'
import { AuthorityCheckerService } from './authority-checker.service'
import { LoggerModule } from '../logger/logger.module'

@Global()
@Module({
  imports: [LoggerModule],
  providers: [AuthorityCheckerService],
  exports: [AuthorityCheckerService]
})
export class CommonModule {}
