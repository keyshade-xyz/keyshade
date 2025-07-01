import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandOption,
  type CommandActionData,
  type CommandArgument
} from 'src/types/command/command.types'
import { Logger } from '@/util/logger'
import { PAGINATION_OPTION } from '@/util/pagination-options'
import { Table } from '@/util/table'

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

    Logger.header('Fetching all environments...')

    const {
      data: environments,
      error,
      success
    } = await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      { projectSlug, ...options },
      this.headers
    )

    if (success) {
      const headers = ['#', '📦 Environment Name', '🆔 Environment Slug']
      const rows = environments.items.map((environment: any, index: number) => [
        (index + 1).toString(),
        environment.name,
        environment.slug
      ])
      Table.render(headers, rows)
    } else {
      this.logError(error)
    }
  }
}
