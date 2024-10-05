import PgBoss from 'pg-boss'

class JobHandler {
  private boss: PgBoss

  constructor(connectionString: string) {
    this.boss = new PgBoss(connectionString)
    this.initialize()
  }

  private async initialize() {
    try {
      await this.boss.start()
      console.log('PgBoss started successfully')
    } catch (error) {
      console.error('Error starting PgBoss:', error)
      throw error
    }
  }

  async registerJob<T, V>(
    queue: string,
    callback: (job: V) => Promise<T>
  ): Promise<void> {
    try {
      await this.boss.work(queue, async ([job]) => {
        try {
          await callback(job.data)
          await this.boss.complete(queue, job.id)
        } catch (error) {
          console.error(`Error processing job in queue ${queue}:`, error)
          throw error
        }
      })
      console.log(`Registered job handler for queue: ${queue}`)
    } catch (error) {
      console.error(`Error registering job handler for queue ${queue}:`, error)
      throw error
    }
  }

  async scheduleJob<V>(
    name: string,
    cron: string,
    data: V,
    options?: PgBoss.ScheduleOptions
  ): Promise<void> {
    try {
      const jobId = await this.boss.schedule(name, cron, data, options)
      console.log(`Scheduled job in queue ${name} with ID: ${jobId}`)
    } catch (error) {
      console.error(`Error scheduling job in queue ${name}:`, error)
      throw error
    }
  }

  async stop(): Promise<void> {
    try {
      await this.boss.stop()
      console.log('PgBoss stopped successfully')
    } catch (error) {
      console.error('Error stopping PgBoss:', error)
      throw error
    }
  }
}

export default JobHandler
