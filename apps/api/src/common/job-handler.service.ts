import { PG_BOSS } from '@/provider/pgboss.provider'
import { Inject, Injectable, LoggerService } from '@nestjs/common'
import PgBoss from 'pg-boss'

@Injectable()
export class JobHandlerService {
  private readonly logger: LoggerService

  constructor(
    @Inject(PG_BOSS) private boss: PgBoss,
    @Inject('Logger') logger: LoggerService
  ) {
    this.logger = logger
  }

  async registerJob<T, V>(
    queue: string,
    callback: (job: V) => Promise<T>
  ): Promise<void> {
    try {
      await this.boss.work(queue, async ([job]) => {
        try {
          const jobData = job.data as V
          await callback(jobData)
          await this.boss.complete(queue, job.id)
        } catch (error) {
          this.logger.error(`Error processing job in queue ${queue}`)
          throw new Error(`Error processing job in queue ${queue}`)
        }
      })
      this.logger.log(`Registered job handler for queue ${queue}`)
    } catch (error) {
      this.logger.error(`Error registering job handler for queue ${queue}`)
      throw new Error(`Error registering job handler for queue ${queue}`)
    }
  }

  async scheduleJob<V extends object>(
    name: string,
    cron: string,
    data: V,
    options?: PgBoss.ScheduleOptions
  ): Promise<void> {
    try {
      const jobId = await this.boss.schedule(name, cron, data, options)
      this.logger.log(`Scheduled job in queue ${name} with ID: ${jobId}`)
    } catch (error) {
      this.logger.error(`Error scheduling job in queue ${name}`)
      throw new Error(`Error scheduling job in queue ${name}: ${error.message}`)
    }
  }

  async stop(): Promise<void> {
    try {
      await this.boss.stop()
      this.logger.log('PgBoss stopped successfully')
    } catch (error) {
      this.logger.error(`Error stopping PgBoss: ${error.message}`)
      throw new Error(`Error stopping PgBoss: ${error.message}`)
    }
  }
}
