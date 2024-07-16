import { Logger, Provider } from '@nestjs/common'
import { exit } from 'process'
import * as redis from 'redis'

export const REDIS_CLIENT = 'RedisClient'

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: async () => {
    const logger = new Logger('RedisProvider')
    if (!process.env.REDIS_URL) {
      logger.error('Redis credentials are not set. Stopping the application.')
      exit(1)
    }

    const subscriber = redis.createClient({
      url: process.env.REDIS_URL
    })
    const publisher = subscriber.duplicate()

    publisher.on('error', (error) => {
      logger.error('Redis client error:', error)
    })
    await publisher.connect()

    subscriber.on('error', (error) => {
      logger.error('Redis client error:', error)
    })
    await subscriber.connect()

    return {
      subscriber,
      publisher
    }
  }
}
