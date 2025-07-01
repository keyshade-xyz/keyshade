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
    return [...PAGINATION_OPTION]
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
      if (secrets.length > 0) {
        for (const { secret, values } of secrets) {
          Logger.info(`- ${secret.name} (${secret.slug})`)
          for (const {
            environment,
            value,
            version,
            createdOn,
            createdBy
          } of values) {
            Logger.info(
              `  | ${environment.name} (${environment.slug}): ${projectPrivateKey ? await decrypt(projectPrivateKey, value) : 'Hidden'} (version ${version})`
            )
            Logger.info(
              `  | Created on ${formatDate(createdOn)} by ${createdBy.name}`
            )
            Logger.info('')
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
