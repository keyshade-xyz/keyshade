import { Global, Module } from '@nestjs/common'
import { AuthorityCheckerService } from './authority-checker.service'

@Global()
@Module({
  providers: [AuthorityCheckerService],
  exports: [AuthorityCheckerService]
})
export class CommonModule {}
