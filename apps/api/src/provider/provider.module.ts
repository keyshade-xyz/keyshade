import { Global, Module } from '@nestjs/common'
import { REDIS_CLIENT, RedisProvider } from './redis.provider'
import { POLAR_CLIENT, PolarProvider } from './polar.provider'

@Global()
@Module({
  exports: [
    {
      provide: REDIS_CLIENT,
      useValue: RedisProvider
    },
    {
      provide: POLAR_CLIENT,
      useValue: PolarProvider
    }
  ],
  providers: [RedisProvider, PolarProvider]
})
export class ProviderModule {}
