import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RedisClientType } from 'redis'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import {
  FILE_UPLOAD_SERVICE,
  FileUploadService
} from '@/file-upload/file-upload.service'

interface DailyMetrics {
  totalRunCommandExecutions: number
  totalSecretPulls: number
  totalVariablePulls: number
}

@Injectable()
export class MetricsService {
  private static readonly METRICS_CACHE_KEY = 'daily-metrics'
  private readonly logger = new Logger(MetricsService.name)

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: { publisher: RedisClientType },
    @Inject(FILE_UPLOAD_SERVICE)
    private readonly fileUploadService: FileUploadService
  ) {}

  async incrementSecretPull(): Promise<void> {
    try {
      await this.redisClient.publisher.hIncrBy(
        MetricsService.METRICS_CACHE_KEY,
        'totalSecretPulls',
        1
      )
      this.logger.debug('Incremented secret pull count')
    } catch (error) {
      this.logger.error('Failed to increment secret pull count', error)
    }
  }

  async incrementVariablePull(): Promise<void> {
    try {
      await this.redisClient.publisher.hIncrBy(
        MetricsService.METRICS_CACHE_KEY,
        'totalVariablePulls',
        1
      )
      this.logger.debug('Incremented variable pull count')
    } catch (error) {
      this.logger.error('Failed to increment variable pull count', error)
    }
  }

  async incrementRunCommandExecution(): Promise<void> {
    try {
      await this.redisClient.publisher.hIncrBy(
        MetricsService.METRICS_CACHE_KEY,
        'totalRunCommandExecutions',
        1
      )
      this.logger.debug('Incremented run command execution count')
    } catch (error) {
      this.logger.error(
        'Failed to increment run command execution count',
        error
      )
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateAndStoreMetrics(): Promise<void> {
    this.logger.log('Starting daily metrics aggregation')

    try {
      const metrics = await this.getCurrentMetrics()

      if (this.hasAnyMetrics(metrics)) {
        await this.storeMetricsToFile(metrics)
        await this.flushMetricsCache()
        this.logger.log('Daily metrics aggregated and stored successfully')
      } else {
        this.logger.log('No metrics data to aggregate for today')
      }
    } catch (error) {
      this.logger.error('Failed to aggregate daily metrics', error)
    }
  }

  private async getCurrentMetrics(): Promise<DailyMetrics> {
    const metricsData = await this.redisClient.publisher.hGetAll(
      MetricsService.METRICS_CACHE_KEY
    )

    return {
      totalRunCommandExecutions: parseInt(
        metricsData.totalRunCommandExecutions || '0',
        10
      ),
      totalSecretPulls: parseInt(metricsData.totalSecretPulls || '0', 10),
      totalVariablePulls: parseInt(metricsData.totalVariablePulls || '0', 10)
    }
  }

  private hasAnyMetrics(metrics: DailyMetrics): boolean {
    return (
      metrics.totalRunCommandExecutions > 0 ||
      metrics.totalSecretPulls > 0 ||
      metrics.totalVariablePulls > 0
    )
  }

  private async storeMetricsToFile(metrics: DailyMetrics): Promise<void> {
    const now = new Date()
    const filename = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`

    const metricsJson = JSON.stringify(metrics, null, 2)
    const file = new File([metricsJson], filename, { type: 'application/json' })

    await this.fileUploadService.uploadFiles([file], 'metrics/', 0)
    this.logger.log(`Metrics stored to file: ${filename}`)
  }

  private async flushMetricsCache(): Promise<void> {
    await this.redisClient.publisher.del(MetricsService.METRICS_CACHE_KEY)
    this.logger.log('Metrics cache flushed')
  }

  async getMetricsForTesting(): Promise<DailyMetrics> {
    return await this.getCurrentMetrics()
  }
}
