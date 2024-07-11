import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import EnvironmentController from '../../../../../packages/api-client/src/controllers/environment/environment'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'

export class GetEnvironment extends BaseCommand {
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

    const baseUrl = this.baseUrl
    const apiKey = this.apiKey

    const headers = {
      baseUrl,
      apiKey
    }

    try {
      const environment = await EnvironmentController.getEnvironmentById(
        { environment_id },
        headers
      )
      Logger.log(`Environment ${environment_id}:`)
      Logger.log(`- Name: ${environment.name}`)
      Logger.log(`- Description: ${environment.description}`)
    } catch (error) {
      Logger.error(error.message)
    }
  }
}
