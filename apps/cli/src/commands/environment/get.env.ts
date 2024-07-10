import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import EnvironmentController from '../../http/project'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'

export class GetEnvironment extends BaseCommand {
  private environmentController = new EnvironmentController()

  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Get an environment'
  }

  getOptions(): CommandOption[] {
    return []
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [environment_id] = args

    if (!environment_id) {
      Logger.error('Environment ID is required')
      return
    }

    const baseUrl = process.env.BASE_URL
    const apiKey = process.env.API_KEY

    try {
      const environment = await this.environmentController.getEnvironmentById(
        baseUrl,
        apiKey,
        environment_id
      )
      Logger.log(`Environment ${environment_id}:`)
      Logger.log(`- Name: ${environment.name}`)
      Logger.log(`- Description: ${environment.description}`)
    } catch (error) {
      Logger.error(error.message)
    }
  }
}
