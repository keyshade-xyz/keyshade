import { Global, Module } from '@nestjs/common'
import { REDIS_CLIENT, RedisProvider } from './redis.provider'
import { MINIO_CLIENT, MinioProvider } from './minio.provider'
import { POLAR_CLIENT, PolarProvider } from './polar.provider'

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
      provide: POLAR_CLIENT,
      useValue: PolarProvider
    }
  ],
  providers: [RedisProvider, MinioProvider, PolarProvider]
})
export class ProviderModule {}
