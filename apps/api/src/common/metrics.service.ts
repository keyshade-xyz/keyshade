import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import {
  FILE_UPLOAD_SERVICE,
  FileUploadService
} from '@/file-upload/file-upload.service'

@Injectable()
export class MetricService {
  private readonly logger = new Logger(MetricService.name)

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: { publisher: RedisClientType },
    @Inject(FILE_UPLOAD_SERVICE)
    private readonly fileUploadService: FileUploadService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async UploadMetrics() {
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

      // create JSON file
      const filename = `metrics-${yesterday}.json`
      const jsonContent = JSON.stringify({ date: yesterday, metrics }, null, 2)
      const file = new File([jsonContent], filename, {
        type: 'application/json'
      })
      this.logger.log(`Created metrics file ${filename}`)

      // Upload file to storage
      await this.fileUploadService.uploadFiles([file], 'metrics/', 0)
      this.logger.log(`Uploaded metrics file ${filename} to storage`)

      //delete local file after upload
      await this.redisClient.publisher.del(redisKey)
      this.logger.log(`Deleted Redis key ${redisKey} after uploading metrics`)
    } catch (error) {
      this.logger.error(`Failed to fetch metrics`, error as any)
    }
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
  async incrementGetAllSecretsOfProject(
    numberOfProjects: number
  ): Promise<void> {
    await this.incrementMetric('totalGetAllSecretsOfProject', numberOfProjects)
  }
  async incrementGetAllVariablesOfProject(
    numberOfProjects: number
  ): Promise<void> {
    await this.incrementMetric(
      'totalGetAllVariablesOfProject',
      numberOfProjects
    )
  }

  async incrementMetric(key: string, value: number): Promise<void> {
    const today: string = new Date().toISOString().split('T')[0]
    const redisKey: string = `metrics:${today}`
    const TTL_SECONDS: number = 60 * 60 * 24 * 2 // 2 days

    try {
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
    } catch (err) {
      this.logger.error(
        `Failed to increment metric ${key} on ${today} by the value ${value}`,
        err as any
      )
    }
  }
}
