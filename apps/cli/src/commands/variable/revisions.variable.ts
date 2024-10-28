import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

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

  async action({ args }: CommandActionData): Promise<void> {
    const [variableSlug, environmentSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().variableController.getRevisionsOfVariable(
        {
          variableSlug,
          environmentSlug
        },
        this.headers
      )

    if (success) {
      const revisions = data.items
      if (revisions.length > 0) {
        data.items.forEach((revision: any) => {
          Logger.info(`Id ${revision.id}`)
          Logger.info(`value ${revision.value}`)
          Logger.info(`version ${revision.version}`)
          Logger.info(`variableID ${revision.variableId}`)
          Logger.info(`Created On ${revision.createdOn}`)
          Logger.info(`Created By Id ${revision.createdById}`)
          Logger.info(`environmentId ${revision.environmentId}`)
        })
      } else {
        Logger.info('No revisions found')
      }
    } else {
      Logger.error(`Failed fetching revisions: ${error.message}`)
    }
  }
}
