import { Module } from '@nestjs/common'
import { VariableController } from './variable.controller'
import { VariableService } from './variable.service'

@Module({
  controllers: [VariableController],
  providers: [VariableService],
  exports: [VariableService]
})
export class VariableModule {}
