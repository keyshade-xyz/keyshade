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
import { Table } from '@/util/table'
import chalk from 'chalk'

export default class ListVariable extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all variable under a project'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-v',
        long: '--verbose',
        description: 'Prints detailed information about each variable'
      },
      ...PAGINATION_OPTION
    ]
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
    const { verbose } = options
    if (!projectSlug) {
      Logger.error('Project slug is required')
      return
    }
    Logger.header(`Fetching all variables for ${projectSlug}...`)
    console.log('')
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
        if (verbose) {
          const headers = [
            '📑 Variable',
            '📦 Environment',
            '📊 Version',
            '💾 Value',
            '🗓️ Created On',
            '👤 Created By'
          ]

          variables.forEach(({ variable, values }) => {
            Logger.info(` - ${chalk.bold(variable.name)}(${variable.slug})`)
            const rows = values.map(
              ({ environment, value, version, createdOn, createdBy }) => [
                `${variable.name}(${variable.slug})`,
                environment.name,
                String(version),
                value,
                formatDate(createdOn),
                createdBy.name
              ]
            )
            Table.render(headers, rows)
          })
        } else {
          const headers = [
            '📑 Variable',
            '📦 Environment',
            '📊 Version',
            '💾 Value'
          ]

          variables.forEach(({ variable, values }) => {
            Logger.info(` - ${chalk.bold(variable.name)}(${variable.slug})`)
            const rows = values.map(({ environment, value, version }) => [
              `${variable.name}(${variable.slug})`,
              environment.name,
              String(version),
              value
            ])
            Table.render(headers, rows)
          })
        }
      } else {
        Logger.info('No variables found')
      }
    } else {
      this.logError(error)
    }
  }
}
