import { Global, Module } from '@nestjs/common'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'
import { UserCacheService } from '@/cache/user-cache.service'

@Global()
@Module({
  exports: [UserCacheService, WorkspaceCacheService],
  providers: [UserCacheService, WorkspaceCacheService]
})
export class CacheModule {}
