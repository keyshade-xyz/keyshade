import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import formatDate from '@/util/date-formatter'
import { PAGINATION_OPTION } from '@/util/pagination-options'
import { fetchPrivateKey } from '@/util/configuration'
import { decrypt } from '@/util/decrypt'
import { Table } from '@/util/table'
import chalk from 'chalk'

export default class ListSecret extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all secrets under a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project whose secrets you want.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-v',
        long: '--verbose',
        description: 'Prints detailed information about each secret'
      },
      ...PAGINATION_OPTION
    ]
  }

  getUsage(): string {
    return `keyshade secret list <project slug> [options]

  List all secrets under a project
  keyshade secret list project-1

  Pagination options
  keyshade secret list project-1 --page 1 --limit 10
  `
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { verbose } = options
    if (!projectSlug) {
      Logger.error('Project slug is required')
      return
    }
    const { paginationOptions } = await this.parseInput(options)
    const projectPrivateKey = await fetchPrivateKey(projectSlug)

    const { data, error, success } =
      await ControllerInstance.getInstance().secretController.getAllSecretsOfProject(
        {
          projectSlug,
          ...paginationOptions
        },
        this.headers
      )

    if (success) {
      const secrets = data.items
      Logger.header(`Fetching all secrets for ${projectSlug}...`)
      if (secrets.length > 0) {
        if (verbose) {
          const headers = [
            '📑 Variable',
            '📦 Environment',
            '📊 Version',
            '💾 Value',
            '🗓️ Created On',
            '👤 Created By'
          ]
          for (const { secret, values } of secrets) {
            Logger.info(` - ${chalk.bold(secret.name)}(${secret.slug})`)
            const rows = await Promise.all(
              values.map(
                async ({
                  environment,
                  value,
                  version,
                  createdOn,
                  createdBy
                }) => [
                  `${secret.name}(${secret.slug})`,
                  environment.name,
                  String(version),
                  projectPrivateKey !== null
                    ? await decrypt(projectPrivateKey, value)
                    : 'Hidden',
                  formatDate(createdOn),
                  createdBy.name
                ]
              )
            )
            Table.render(headers, rows)
          }
        } else {
          const headers = [
            '📑 Variable',
            '📦 Environment',
            '📊 Version',
            '💾 Value'
          ]
          for (const { secret, values } of secrets) {
            Logger.info(` - ${chalk.bold(secret.name)}(${secret.slug})`)
            const rows = await Promise.all(
              values.map(async ({ environment, value, version }) => [
                `${secret.name}(${secret.slug})`,
                environment.name,
                String(version),
                projectPrivateKey !== null
                  ? await decrypt(projectPrivateKey, value)
                  : 'Hidden'
              ])
            )
            Table.render(headers, rows)
          }
        }
      } else {
        Logger.info('No secrets found')
      }
    } else {
      this.logError(error)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    paginationOptions: CommandActionData['options']
  }> {
    const { ...paginationOptions } = options // defaults to false
    return {
      paginationOptions
    }
  }
}
