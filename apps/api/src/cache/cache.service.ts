import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { createClient, RedisClientType } from 'redis'
import { User } from '@prisma/client'

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redisClient: RedisClientType
  private readonly userPrefix = 'user-'

  constructor() {
    this.redisClient = createClient({
      url: 'redis://localhost:6379' // Replace with your Redis URL
      // Add other Redis configuration options as needed
    })
    this.redisClient.connect()
  }

  private getUserKey(userId: string): string {
    return `${this.userPrefix}${userId}`
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
    const keys = await this.redisClient.keys(`${this.userPrefix}*`)
    if (keys.length > 0) {
      await this.redisClient.del(keys)
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit()
  }
}
