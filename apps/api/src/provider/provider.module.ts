import { Global, Module } from '@nestjs/common'
import { REDIS_CLIENT, RedisProvider } from './redis.provider'

@Global()
@Module({
  exports: [
    {
      provide: REDIS_CLIENT,
      useValue: RedisProvider
    }
  ],
  providers: [RedisProvider]
})
export class ProviderModule {}
