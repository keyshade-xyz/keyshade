import { forwardRef, Module } from '@nestjs/common'
import { VariableController } from './variable.controller'
import { VariableService } from './variable.service'
import { SecretModule } from '@/secret/secret.module'

@Module({
  controllers: [VariableController],
  providers: [VariableService],
  exports: [VariableService],
  imports: [forwardRef(() => SecretModule)]
})
export class VariableModule {}
