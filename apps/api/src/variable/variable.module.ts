import { Module } from '@nestjs/common'
import { VariableController } from './variable.controller'
import { VariableService } from './variable.service'

@Module({
  controllers: [VariableController],
  providers: [VariableService]
})
export class VariableModule {}
