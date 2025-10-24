import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class MetricService {
  private readonly logger = new Logger(MetricService.name)

  constructor() {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async UploadMetrics() {
    //get metrics from db
    //place JSON in to metrics/ directory
    //upload to Azura
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
    this.logger.log(`Incrementing metric ${key} by ${value}`)

    //get current value from db

    //increment by value

    //save back to db
  }
}
