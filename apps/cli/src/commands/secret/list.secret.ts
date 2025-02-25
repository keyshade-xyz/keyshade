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
        short: '-d',
        long: '--decrypt-value',
        description:
          'Set this to true if the project contains the private key. If set to true, the values of the secret will be in plaintext format'
      },
      ...PAGINATION_OPTION
    ]
  }

  getUsage(): string {
    return `keyshade secret list <project slug> [options]

  List all secrets under a project
  keyshade secret list project-1

  Decrypt values while listing
  keyshade secret list project-1 --decrypt-value

  Pagination options
  keyshade secret list project-1 --page 1 --limit 10
  `
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { decryptValue, paginationOptions } = await this.parseInput(options)

    const { data, error, success } =
      await ControllerInstance.getInstance().secretController.getAllSecretsOfProject(
        {
          projectSlug,
          decryptValue,
          ...paginationOptions
        },
        this.headers
      )

    if (success) {
      const secrets = data.items
      if (secrets.length > 0) {
        secrets.forEach(({ secret, values }) => {
          Logger.info(`- ${secret.name} (${secret.slug})`)
          values.forEach(
            ({ environment, value, version, createdOn, createdBy }) => {
              Logger.info(
                `  | ${environment.name} (${environment.slug}): ${decryptValue ? value : 'Hidden'} (version ${version})`
              )
              Logger.info(
                `  | Created on ${formatDate(createdOn)} by ${createdBy.name}`
              )
              Logger.info('')
            }
          )
        })
      } else {
        Logger.info('No secrets found')
      }
    } else {
      this.logError('Failed fetching secrets', error)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    decryptValue: boolean
    paginationOptions: CommandActionData['options']
  }> {
    const { decryptValue = false, ...paginationOptions } = options // defaults to false
    return {
      decryptValue,
      paginationOptions
    }
  }
}
