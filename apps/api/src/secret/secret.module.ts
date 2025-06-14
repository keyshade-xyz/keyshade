import { Module } from '@nestjs/common'
import { SecretController } from './secret.controller'
import { SecretService } from './secret.service'

@Module({
  controllers: [SecretController],
  providers: [SecretService],
  exports: [SecretService]
})
export class SecretModule {}
