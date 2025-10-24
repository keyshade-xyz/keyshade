import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
//import { writeFile } from 'fs/promises'

@Injectable()
export class MetricService {
  private readonly logger = new Logger(MetricService.name)

  constructor(
    @Inject(REDIS_CLIENT) private redisClient: { publisher: RedisClientType }
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async UploadMetrics() {
    //get metrics from db
    // try {
    //   const redisKey = `metrics`
    //   const metrics = await this.redisClient.publisher.hGetAll(redisKey)
    //   this.logger.log(`Fetched metrics: ${JSON.stringify(metrics)}`)
    //   //place JSON in to metrics/ directory
    //   await writeFile(`metrics/${Date.now()}.json`, JSON.stringify(metrics))
    //   this.logger.log(`Placing metrics into metrics/ directory`)
    //   await this.redisClient.publisher.del('metrics')
    //   // upload to Azure
    //   // create a file object
    //   const filename = `${Date.now()}.json`
    //   const jsonContent = JSON.stringify(metrics, null, 2)
    //   const file = new File([jsonContent], filename, {
    //     type: 'application/json'
    //   })
    //   this.logger.log(`Created metrics file ${filename}`)
    // } catch (error) {
    //   this.logger.error(`Failed to fetch metrics`, error as any)
    // }
    //flush cache
  }

  async incrementSecretPull(numberOfSecrets: number): Promise<void> {
    await this.incrementMetric('totalSecretPulls', numberOfSecrets)
  }
  async incrementVariablePull(numberOfVariables: number): Promise<void> {
    await this.incrementMetric('totalVariablePulls', numberOfVariables)
  }
  async incrementRunCommandExecution(
    numberOfRunCommands: number
  ): Promise<void> {
    await this.incrementMetric('totalRunCommandExecutions', numberOfRunCommands)
  }

  async incrementMetric(key: string, value: number): Promise<void> {
    // change the name
    const redisKey = `metrics`
    const TTL_SECONDS = 60 * 60 * 24

    try {
      const newValue = await this.redisClient.publisher.hIncrBy(
        redisKey,
        key,
        value
      )

      // Ensure the key has a TTL so stale data doesn't persist forever
      const ttl = await this.redisClient.publisher.ttl(redisKey)
      // ttl < 0 means no expire (-1) or key does not exist (-2). Set expire when absent
      if (ttl < 0) {
        await this.redisClient.publisher.expire(redisKey, TTL_SECONDS)
      }

      this.logger.log(
        `Metric ${key} incremented by ${value} on ${redisKey} (new=${newValue})`
      )
    } catch (err) {
      this.logger.error(`Failed to increment metric ${key}`, err as any)
      throw err
    }
  }
}
