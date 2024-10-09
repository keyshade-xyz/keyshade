import { Global, Module } from '@nestjs/common'
import { REDIS_CLIENT, RedisProvider } from './redis.provider'
import { MINIO_CLIENT, MinioProvider } from './minio.provider'
import { PG_BOSS, PgBossProvider } from './pgboss.provider'

@Global()
@Module({
  exports: [
    {
      provide: REDIS_CLIENT,
      useValue: RedisProvider
    },
    {
      provide: MINIO_CLIENT,
      useValue: MinioProvider
    },
    {
      provide: PG_BOSS,
      useValue: PgBossProvider
    }
  ],
  providers: [RedisProvider, MinioProvider, PgBossProvider]
})
export class ProviderModule {}
