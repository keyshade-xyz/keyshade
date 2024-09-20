import BaseCommand from '../base.command'
import { EnvironmentController } from '@keyshade/api-client/src'
import {
  CommandOption,
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

  getOptions(): CommandOption[] {
    return [
      {
        short: '-p',
        long: '--page <page>',
        description: 'Index of the page.'
      },
      {
        short: '-l',
        long: '--limit <items>',
        description: 'Total number of items per page.'
      },
      {
        short: '-o',
        long: '--order <sort order>',
        description:
          'Order to sort by - either ascending (ASC) or descending (DESC).'
      },
      {
        short: '--sort',
        long: '--sort <field name>',
        description: 'Field to sort by.'
      },
      {
        short: '-s',
        long: '--search <search>',
        description: 'Search term.'
      }
    ]
  }
  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { page, limit, order, sort, search } = options
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
      { projectSlug, page, limit, order, sort, search },
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
