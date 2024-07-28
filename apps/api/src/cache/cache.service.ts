import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { createClient, RedisClientType } from 'redis'
import { User } from '@prisma/client'

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redisClient: RedisClientType
  private static readonly USER_PREFIX = 'user-'
  private readonly logger = new Logger(CacheService.name)

  constructor() {
    if (process.env.REDIS_URL) {
      this.redisClient = createClient({
        url: process.env.REDIS_URL
      })
      this.redisClient.connect().catch((error) => {
        this.logger.error('Failed to connect to Redis', error)
      })
    } else {
      this.logger.warn(
        'REDIS_URL is not set. CacheService will not be functional.'
      )
    }
  }

  private getUserKey(userId: string): string {
    return `${CacheService.USER_PREFIX}${userId}`
  }

  async setUser(user: User, expirationInSeconds?: number): Promise<void> {
    const key = this.getUserKey(user.id)
    const userJson = JSON.stringify(user)
    if (expirationInSeconds) {
      await this.redisClient.setEx(key, expirationInSeconds, userJson)
    } else {
      await this.redisClient.set(key, userJson)
    }
  }

  async getUser(userId: string): Promise<User | null> {
    const key = this.getUserKey(userId)
    const userData = await this.redisClient.get(key)
    if (userData) {
      return JSON.parse(userData) as User
    }
    return null
  }

  async deleteUser(userId: string): Promise<number> {
    const key = this.getUserKey(userId)
    return await this.redisClient.del(key)
  }

  async clearAllUserCache(): Promise<void> {
    const keys = await this.redisClient.keys(`${CacheService.USER_PREFIX}*`)
    if (keys.length > 0) {
      await this.redisClient.del(keys)
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit()
  }
}
