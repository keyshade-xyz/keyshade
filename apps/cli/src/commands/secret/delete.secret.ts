import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class DeleteSecret extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Deletes a secret'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Secret Slug>',
        description: 'Slug of the secret that you want to delete.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [secretSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().secretController.deleteSecret(
        {
          secretSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(`Secret ${secretSlug} deleted successfully!`)
    } else {
      Logger.error(`Failed to delete secret: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed to delete secret.\n' + JSON.stringify(error))
      }
    }
  }
}
