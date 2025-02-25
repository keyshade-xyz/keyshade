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

export default class FetchVariableRevisions extends BaseCommand {
  getName(): string {
    return 'revisions'
  }

  getDescription(): string {
    return 'Fetch all revisions of a variable'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Variable Slug>',
        description: 'Slug of the variable whose revisions you want.'
      },
      {
        name: '<Environment Slug>',
        description:
          'Environment slug of the variable whose revisions you want.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--environment <string>',
        description:
          'Environment slug of the variable whose revisions you want.'
      },
      ...PAGINATION_OPTION
    ]
  }

  getUsage(): string {
    return `keyshade variable revisions <variable slug> [options]
  
  Fetch all revisions of a variable
  keyshade variable revisions variable-1 --environment dev
  
  Pagination options
  keyshade variable revisions variable-1 --environment dev --page 1 --limit 10
  `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [variableSlug] = args
    const { environment, ...paginationOptions } = options

    const { data, error, success } =
      await ControllerInstance.getInstance().variableController.getRevisionsOfVariable(
        {
          variableSlug,
          environmentSlug: environment,
          ...paginationOptions
        },
        this.headers
      )

    if (success) {
      const revisions = data.items
      if (revisions.length > 0) {
        Logger.info(
          `Listing revisions of variable ${variableSlug} in environment ${environment}`
        )
        data.items.forEach((revision) => {
          Logger.info(`  | ${revision.value} (version ${revision.version})`)
          Logger.info(
            `  | Created on ${formatDate(revision.createdOn)} by ${revision.createdBy.name}`
          )
          Logger.info('')
        })
      } else {
        Logger.info('No revisions found')
      }
    } else {
      this.logError('Failed fetching revisions', error)
    }
  }
}
