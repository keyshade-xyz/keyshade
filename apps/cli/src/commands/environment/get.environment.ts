import { Logger } from '@/util/logger'
import BaseCommand from '../base.command'
import { EnvironmentController } from '@keyshade/api-client'
import {
  type CommandActionData,
  type CommandArgument
} from 'src/types/command/command.types'

export class GetEnvironment extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Get an environment'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Environment ID>',
        description: 'ID of the environment which you want to fetch.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [environmentId] = args

    if (!environmentId) {
      Logger.error('Environment ID is required')
      return
    }

    const apiKey = this.apiKey

    const headers = {
      'x-keyshade-token': apiKey
    }

    const environmentController = new EnvironmentController(this.baseUrl)
    Logger.info('Fetching Environment...')

    const {
      success,
      error,
      data: environment
    } = await environmentController.getEnvironmentById(
      { id: environmentId },
      headers
    )

    if (success) {
      Logger.info('Environment fetched successfully:')
      Logger.info(
        `Environment ID: ${environment.id}, Name: ${environment.name}, Description: ${environment.description}`
      )
    } else {
      Logger.error(`Error fetching environment: ${error.message}`)
    }
  }
}
