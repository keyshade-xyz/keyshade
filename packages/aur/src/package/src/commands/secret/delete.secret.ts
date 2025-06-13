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

  getUsage(): string {
    return `keyshade secret delete <secret slug>

  Delete a secret
  keyshade secret delete secret-1
    `
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
      this.logError(error)
    }
  }
}
