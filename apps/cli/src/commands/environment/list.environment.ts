import BaseCommand from '../base.command'
import { EnvironmentController } from '@keyshade/api-client'
import {
  type CommandActionData,
  type CommandArgument
} from 'src/types/command/command.types'
import { Logger } from '@/util/logger'

export class ListEnvironment extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all environments under a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project ID>',
        description: 'ID of the project whose environments you want.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectId] = args

    if (!projectId) {
      Logger.error('Project ID is required')
      return
    }

    const apiKey = this.apiKey

    const headers = {
      'x-keyshade-token': apiKey
    }

    if (!apiKey) {
      Logger.error('Base URL and API Key must be set as environment variables')
      return
    }

    const environmentController = new EnvironmentController(this.baseUrl)
    Logger.info('Fetching all environments...')

    const {
      success,
      data: environments,
      error
    } = await environmentController.getAllEnvironmentsOfProject(
      { projectId },
      headers
    )

    if (success) {
      Logger.info('Fetched environments:')
      environments.items.forEach((environment) => {
        Logger.info(
          `- ID: ${environment.id}, Name: ${environment.name}, Description: ${environment.description}`
        )
      })
    } else {
      Logger.error(`Failed to fetch environments: ${error.message}`)
    }
  }
}
