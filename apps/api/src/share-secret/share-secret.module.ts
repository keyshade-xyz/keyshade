import { Module } from '@nestjs/common'
import { ShareSecretController } from './share-secret.controller'
import { ShareSecretService } from './share-secret.service'

@Module({
  controllers: [ShareSecretController],
  providers: [ShareSecretService]
})
export class ShareSecretModule {}
