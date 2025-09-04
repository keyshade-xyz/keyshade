import { Global, Module } from '@nestjs/common'
import { REDIS_CLIENT, RedisProvider } from './redis.provider'
import { POLAR_CLIENT, PolarProvider } from './polar.provider'
import {
  AZURE_CONTAINER_CLIENT,
  AzureContainerProvider
} from '@/provider/azure-container.provider'

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
    },
    {
      provide: AZURE_CONTAINER_CLIENT,
      useValue: AzureContainerProvider
    }
  ],
  providers: [RedisProvider, PolarProvider, AzureContainerProvider]
})
export class ProviderModule {}
