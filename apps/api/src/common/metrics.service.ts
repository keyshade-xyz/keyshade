import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class MetricService {
  constructor() {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  public async UploadMetrics() {
    //get metrics from db
    //place JSON in to metrics/ directory
    //upload to Azura
    //flush cache
  }

  public async incrementSecretPull(numberOfSecrets: number): Promise<void> {
    this.incrementMetric('totalSecretPulls', numberOfSecrets)
  }
  public async incrementVariablePull(numberOfVariables: number): Promise<void> {
    this.incrementMetric('totalVariablePulls', numberOfVariables)
  }
  public async incrementRunCommandExecution(
    numberOfRunCommands: number
  ): Promise<void> {
    this.incrementMetric('totalRunCommandExecutions', numberOfRunCommands)
  }

  public async incrementMetric(key: string, value: number): Promise<void> {
    console.log(`Incrementing metric ${key} by ${value}`)

    //get current value from db

    //increment by value

    //save back to db
  }
}
