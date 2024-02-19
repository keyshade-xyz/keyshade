import { Module } from '@nestjs/common'
import { VariableController } from './controller/variable.controller'
import { VariableService } from './service/variable.service'

@Module({
  controllers: [VariableController],
  providers: [VariableService]
})
export class VariableModule {}
