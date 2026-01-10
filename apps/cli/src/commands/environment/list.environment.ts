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
import {
  GetAllEnvironmentsOfProjectRequestSchema,
  GetAllEnvironmentsOfProjectResponseSchema
} from '@keyshade/schema/raw'
import { type GetEnvironmentResponse } from '@keyshade/schema'

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

    const request = GetAllEnvironmentsOfProjectRequestSchema.safeParse({
      projectSlug,
      ...options
    })
    if (!request.success) {
      Logger.error(request.error.toString())
      return
    }

    Logger.header('Fetching all environments...')

    const {
      data: environments,
      error,
      success
    } = await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      request.data,
      this.headers
    )

    if (!success) {
      this.logError(error)
      return
    }

    const response =
      GetAllEnvironmentsOfProjectResponseSchema.safeParse(environments)
    if (response.success) {
      if (response.data.items.length > 0) {
        const headers = ['#', '📦 Environment Name', '🆔 Environment Slug']
        const rows = response.data.items.map(
          (environment: GetEnvironmentResponse, index: number) => [
            (index + 1).toString(),
            environment.name,
            environment.slug
          ]
        )
        Table.render(headers, rows)
      } else {
        Logger.info('No environments found')
      }
    } else {
      Logger.error('Invalid server response')
    }
  }
}
