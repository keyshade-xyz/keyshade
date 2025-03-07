import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { UserWithWorkspace } from '@/user/user.types'

@Injectable()
export class CacheService implements OnModuleDestroy {
  private static readonly USER_PREFIX = 'user-'

  private readonly logger = new Logger(CacheService.name)

  constructor(
    @Inject(REDIS_CLIENT) private redisClient: { publisher: RedisClientType }
  ) {}

  private getUserKey(userId: string): string {
    return `${CacheService.USER_PREFIX}${userId}`
  }

  async setUser(
    user: UserWithWorkspace,
    expirationInSeconds?: number
  ): Promise<void> {
    this.logger.log(`Setting user cache for user ${user.id}`)
    const key = this.getUserKey(user.id)
    const userJson = JSON.stringify(user)
    if (expirationInSeconds) {
      await this.redisClient.publisher.setEx(key, expirationInSeconds, userJson)
    } else {
      await this.redisClient.publisher.set(key, userJson)
    }
    this.logger.log(`User cache set for user ${user.id}`)
  }

  async getUser(userId: string): Promise<UserWithWorkspace | null> {
    this.logger.log(`Getting user cache for user ${userId}`)
    const key = this.getUserKey(userId)
    const userData = await this.redisClient.publisher.get(key)
    if (userData) {
      this.logger.log(`User cache found for user ${userId}`)
      return JSON.parse(userData) as UserWithWorkspace
    }
    this.logger.log(`User cache not found for user ${userId}`)
    return null
  }

  async deleteUser(userId: string): Promise<number> {
    this.logger.log(`Deleting user cache for user ${userId}`)
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
