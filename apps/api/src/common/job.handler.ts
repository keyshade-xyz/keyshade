import { Inject, Injectable, LoggerService } from '@nestjs/common'
import PgBoss from 'pg-boss'

@Injectable()
export class JobHandlerService {
  private boss: PgBoss
  private readonly logger: LoggerService

  constructor(
    @Inject('DATABASE_CONNECTION_STRING') private connectionString: string
  ) {
    this.boss = new PgBoss(this.connectionString)
    this.initialize()
  }

  private async initialize() {
    try {
      await this.boss.start()
      this.logger.log('PgBoss started successfully')
    } catch (error) {
      this.logger.error(`Error starting PgBoss ${error}`)
      throw new Error(`Error starting PgBoss ${error}`)
    }
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
      throw new Error(`Error scheduling job in queue ${name}:`, error)
    }
  }

  async stop(): Promise<void> {
    try {
      await this.boss.stop()
      console.log('PgBoss stopped successfully')
      this.logger.log('PgBoss stopped successfully')
    } catch (error) {
      this.logger.error('Error stopping PgBoss:', error)
      throw new Error('Error stopping PgBoss:', error)
    }
  }
}
