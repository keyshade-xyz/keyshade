import { Module } from '@nestjs/common'
import { ApiKeyController } from './api-key.controller'
import { ApiKeyService } from './api-key.service'

@Module({
  controllers: [ApiKeyController],
  providers: [ApiKeyService]
})
export class ApiKeyModule {}
