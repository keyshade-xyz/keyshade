import { Module } from '@nestjs/common'
import { SecretController } from './controller/secret.controller'
import { SecretService } from './service/secret.service'

@Module({
  controllers: [SecretController],
  providers: [SecretService]
})
export class SecretModule {}
