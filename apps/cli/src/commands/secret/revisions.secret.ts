import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

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
      },
      {
        name: '<Environment Slug>',
        description: 'Environment slug of the secret whose revisions you want.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [secretSlug, environmentSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().secretController.getRevisionsOfSecret(
        {
          secretSlug,
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
          Logger.info(`secretID ${revision.secretId}`)
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
