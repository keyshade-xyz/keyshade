import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { RedisClientType } from 'redis'
import { User } from '@prisma/client'
import { REDIS_CLIENT } from '@/provider/redis.provider'

@Injectable()
export class CacheService implements OnModuleDestroy {
  private static readonly USER_PREFIX = 'user-'

  constructor(
    @Inject(REDIS_CLIENT) private redisClient: { publisher: RedisClientType }
  ) {}

  private getUserKey(userId: string): string {
    return `${CacheService.USER_PREFIX}${userId}`
  }

  async setUser(user: User, expirationInSeconds?: number): Promise<void> {
    const key = this.getUserKey(user.id)
    const userJson = JSON.stringify(user)
    if (expirationInSeconds) {
      await this.redisClient.publisher.setEx(key, expirationInSeconds, userJson)
    } else {
      await this.redisClient.publisher.set(key, userJson)
    }
  }

  async getUser(userId: string): Promise<User | null> {
    const key = this.getUserKey(userId)
    const userData = await this.redisClient.publisher.get(key)
    if (userData) {
      return JSON.parse(userData) as User
    }
    return null
  }

  async deleteUser(userId: string): Promise<number> {
    const key = this.getUserKey(userId)
    return await this.redisClient.publisher.del(key)
  }

  async clearAllUserCache(): Promise<void> {
    const keys = await this.redisClient.publisher.keys(
      `${CacheService.USER_PREFIX}*`
    )
    if (keys.length > 0) {
      await this.redisClient.publisher.del(keys)
    }
  }

  async onModuleDestroy() {
    await this.redisClient.publisher.quit()
  }
}
