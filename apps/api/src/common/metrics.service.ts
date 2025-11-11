import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class MetricService {
  private readonly logger = new Logger(MetricService.name)

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: { publisher: RedisClientType },
    private readonly prisma: PrismaService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async persistMetrics() {
    try {
      // get yesterday's date and redis key
      const yesterdayDate = new Date()
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterday: string = yesterdayDate.toISOString().split('T')[0]
      const redisKey = `metrics:${yesterday}`

      // fetch metrics from redis
      const metrics = await this.redisClient.publisher.hGetAll(redisKey)
      this.logger.log(
        `Fetched metrics for ${yesterday}: ${JSON.stringify(metrics)}`
      )

      // If no metrics were found for yesterday, do nothing.
      if (Object.keys(metrics).length === 0) {
        this.logger.log(`No metrics found for ${yesterday}. Skipping save.`)
        return
      }

      // parse the JSON object to extract the fields
      const date = yesterday
      const totalSecretPulls = parseInt(metrics.totalSecretPulls || '0')
      const totalVariablePulls = parseInt(metrics.totalVariablePulls || '0')
      const totalRunCommandExecutions = parseInt(
        metrics.totalRunCommandExecutions || '0'
      )

      // save the item in the database
      this.logger.log('Saving metrics to database')
      try {
        await this.prisma.metric.create({
          data: {
            date,
            totalSecretPulls,
            totalVariablePulls,
            totalRunCommandExecutions
          }
        })
      } catch (error) {
        this.logger.error(`Failed to save metrics to database: ${error}`)
        return
      }
      this.logger.log('Saved metrics to database')

      // On successful save, delete the Redis key.
      await this.redisClient.publisher.del(redisKey)
      this.logger.log(`Deleted Redis key ${redisKey} after saving metrics`)
    } catch (error) {
      this.logger.error(`Failed to save metrics`, error as any)
    }
  }

  async incrementSecretPull(numberOfSecrets: number): Promise<void> {
    try {
      await this.incrementMetric('totalSecretPulls', numberOfSecrets)
    } catch (err) {
      this.logger.error(`Failed to increment secret pull metric`, err as any)
    }
  }

  async incrementVariablePull(numberOfVariables: number): Promise<void> {
    try {
      await this.incrementMetric('totalVariablePulls', numberOfVariables)
    } catch (err) {
      this.logger.error(`Failed to increment variable pull metric`, err as any)
    }
  }

  async incrementRunCommandExecution(
    numberOfRunCommands: number
  ): Promise<void> {
    try {
      await this.incrementMetric(
        'totalRunCommandExecutions',
        numberOfRunCommands
      )
    } catch (err) {
      this.logger.error(
        `Failed to increment run command execution metric`,
        err as any
      )
    }
  }

  private async incrementMetric(key: string, value: number): Promise<void> {
    const today: string = new Date().toISOString().split('T')[0]
    const redisKey: string = `metrics:${today}`
    const TTL_SECONDS: number = 60 * 60 * 24 * 2 // 2 days

    const newValue: number = await this.redisClient.publisher.hIncrBy(
      redisKey,
      key,
      value
    )

    // Ensure the key has a TTL so stale data doesn't persist forever
    const ttl: number = await this.redisClient.publisher.ttl(redisKey)
    // ttl < 0 means no expire (-1) or key does not exist (-2). Set expire when absent
    if (ttl < 0) {
      await this.redisClient.publisher.expire(redisKey, TTL_SECONDS)
    }

    this.logger.log(
      `Metric ${key} incremented by ${value} on ${redisKey} (new=${newValue})`
    )
  }
}
