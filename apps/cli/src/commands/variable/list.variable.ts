import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import { PAGINATION_OPTION } from '@/util/pagination-options'
import formatDate from '@/util/date-formatter'

export default class ListVariable extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all variable under a project'
  }

  getOptions(): CommandOption[] {
    return PAGINATION_OPTION
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project whose variable you want.'
      }
    ]
  }

  getUsage(): string {
    return `keyshade variable list <project slug> [options]
  
  List all variables under a project
  keyshade variable list project-1
  
  Pagination options
  keyshade variable list project-1 --page 1 --limit 10
  `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { data, error, success } =
      await ControllerInstance.getInstance().variableController.getAllVariablesOfProject(
        {
          projectSlug,
          ...options
        },
        this.headers
      )

    if (success) {
      const variables = data.items
      if (variables.length > 0) {
        variables.forEach(({ variable, values }) => {
          Logger.info(`- ${variable.name} (${variable.slug})`)
          values.forEach(
            ({ environment, value, version, createdOn, createdBy }) => {
              Logger.info(
                `  | ${environment.name} (${environment.slug}): ${value} (version ${version})`
              )
              Logger.info(
                `  | Created on ${formatDate(createdOn)} by ${createdBy.name}`
              )
              Logger.info('')
            }
          )
        })
      } else {
        Logger.info('No variables found')
      }
    } else {
      Logger.error(`Failed fetching variables: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report(
          'Failed fetching variables for project.\n' + JSON.stringify(error)
        )
      }
    }
  }
}
