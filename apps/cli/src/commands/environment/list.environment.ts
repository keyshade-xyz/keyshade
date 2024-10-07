import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  CommandOption,
  type CommandActionData,
  type CommandArgument
} from 'src/types/command/command.types'
import { Logger } from '@/util/logger'
import { PAGINATION_OPTION } from '@/util/pagination-options'

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
    return PAGINATION_OPTION
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    if (!projectSlug) {
      Logger.error('Project slug is required')
      return
    }

    Logger.info('Fetching all environments...')

    const { data: environments, error, success } = await ControllerInstance
      .getInstance()
      .environmentController.getAllEnvironmentsOfProject(
        { projectSlug, ...options },
        this.headers
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
