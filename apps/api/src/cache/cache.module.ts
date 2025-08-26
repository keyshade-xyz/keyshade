import { Global, Module } from '@nestjs/common'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'
import { UserCacheService } from '@/cache/user-cache.service'
import { CollectiveAuthoritiesCacheService } from '@/cache/collective-authorities-cache.service'
import { ProjectCacheService } from '@/cache/project-cache.service'

@Global()
@Module({
  exports: [
    UserCacheService,
    WorkspaceCacheService,
    CollectiveAuthoritiesCacheService,
    ProjectCacheService
  ],
  providers: [
    UserCacheService,
    WorkspaceCacheService,
    CollectiveAuthoritiesCacheService,
    ProjectCacheService
  ]
})
export class CacheModule {}
