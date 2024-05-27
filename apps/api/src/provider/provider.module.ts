import { Global, Module } from '@nestjs/common'
import { REDIS_CLIENT, RedisProvider } from './redis.provider'
import { MINIO_CLIENT, MinioProvider } from './minio.provider'

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
    }
  ],
  providers: [RedisProvider, MinioProvider]
})
export class ProviderModule {}
