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

export default class FetchSecretRevisions extends BaseCommand {
  getName(): string {
    return 'revisions'
  }

  getDescription(): string {
    return 'Fetch all revisions of a secret'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Secret Slug>',
        description: 'Slug of the secret whose revisions you want.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--environment <string>',
        description: 'Environment slug of the secret whose revisions you want.'
      },
      {
        short: '-d',
        long: '--project-slug <string>',
        description:
          'Optionally decrypt the value by providing the project slug of the secret'
      },
      ...PAGINATION_OPTION
    ]
  }

  getUsage(): string {
    return `keyshade secret revisions <secret slug> [options]

  Fetch all revisions of a secret
  keyshade secret revisions secret-1 --environment dev

  Pagination options
  keyshade secret revisions secret-1 --environment dev --page 1 --limit 10
  `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [secretSlug] = args
    const { environment, privateKey, paginationOptions } =
      await this.parseInput(options)

    const { data, error, success } =
      await ControllerInstance.getInstance().secretController.getRevisionsOfSecret(
        {
          secretSlug,
          environmentSlug: environment,
          ...paginationOptions
        },
        this.headers
      )

    if (success) {
      const revisions = data.items
      if (revisions.length > 0) {
        Logger.info(
          `Listing revisions of secret ${secretSlug} in environment ${environment}`
        )

        for (const revision of revisions) {
          Logger.info(
            `  | ${privateKey !== null ? await decrypt(privateKey, revision.value) : 'Hidden'} (version ${revision.version})`
          )
          Logger.info(
            `  | Created on ${formatDate(revision.createdOn)} by ${revision.createdBy.name}`
          )
          Logger.info('')
        }
      } else {
        Logger.info('No revisions found')
      }
    } else {
      this.logError(error)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    privateKey?: string
    environment: string
    paginationOptions: CommandActionData['options']
  }> {
    const { projectSlug = null, environment, ...paginationOptions } = options // defaults to false

    if (!environment) {
      Logger.error('Environment slug is required')
      process.exit(1)
    }

    const privateKey =
      projectSlug !== null ? await fetchPrivateKey(projectSlug) : null

    return {
      privateKey,
      environment,
      paginationOptions
    }
  }
}
