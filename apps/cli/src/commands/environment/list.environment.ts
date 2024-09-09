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
        name: '<Project Slug>',
        description: 'Slug of the project whose environments you want.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    if (!projectSlug) {
      Logger.error('Project slug is required')
      return
    }

    const headers = {
      'x-keyshade-token': this.apiKey
    }

    const environmentController = new EnvironmentController(this.baseUrl)
    Logger.info('Fetching all environments...')

    const {
      success,
      data: environments,
      error
    } = await environmentController.getAllEnvironmentsOfProject(
      { projectSlug },
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
