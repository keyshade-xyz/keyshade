import { Module } from '@nestjs/common'
import { ApiKeyController } from './controller/api-key.controller'
import { ApiKeyService } from './service/api-key.service'

@Module({
  controllers: [ApiKeyController],
  providers: [ApiKeyService]
})
export class ApiKeyModule {}
