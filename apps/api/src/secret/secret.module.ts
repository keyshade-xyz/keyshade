import { forwardRef, Module } from '@nestjs/common'
import { SecretController } from './secret.controller'
import { SecretService } from './secret.service'
import { VariableModule } from '@/variable/variable.module'

@Module({
  controllers: [SecretController],
  providers: [SecretService],
  exports: [SecretService],
  imports: [forwardRef(() => VariableModule)]
})
export class SecretModule {}
