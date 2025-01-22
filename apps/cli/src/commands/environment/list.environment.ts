import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandOption,
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

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    if (!projectSlug) {
      Logger.error('Project slug is required')
      return
    }

    Logger.info('Fetching all environments...')

    const {
      data: environments,
      error,
      success
    } = await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      { projectSlug, ...options },
      this.headers
    )

    if (success) {
      Logger.info('Fetched environments:')
      environments.items.forEach((environment: any) => {
        Logger.info(`- ${environment.name} (${environment.slug})`)
      })
    } else {
      Logger.error(`Failed to fetch environments: ${error.message}`)
    }
  }
}
