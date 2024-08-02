import { Global, Module } from '@nestjs/common'
import { CacheService } from './cache.service'

@Global()
@Module({
  exports: [CacheService],
  providers: [CacheService]
})
export class CacheModule {}
