import BaseCommand from '@/commands/base.command'
import type {
  CommandOption,
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class TransferOwnershipCommand extends BaseCommand {
  getName(): string {
    return 'transfer-ownership'
  }

  getDescription(): string {
    return 'Transfer the ownership of the workspace to another user '
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to fetch.'
      },
      {
        name: '<New Owner Email>',
        description: 'Email of the new owner of the workspace.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--email <string>',
        description: 'Email of the user to transfer ownership to.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args
    const { email } = options

    const { error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.transferOwnership(
        {
          workspaceSlug,
          userEmail: email
        },
        this.headers
      )

    if (success) {
      Logger.info('Workspace Ownership transferred successfully!')
      Logger.info(`New owner email: ${email}`)
      Logger.info(`Workspace slug: ${workspaceSlug}`)
    } else {
      Logger.error(`Failed to transfer ownership: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed to transfer ownership.\n' + JSON.stringify(error))
      }
    }
  }
}
