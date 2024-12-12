import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
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

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug, newOwnerEmail] = args

    const { error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.transferOwnership(
        {
          workspaceSlug,
          userEmail: newOwnerEmail
        },
        this.headers
      )

    if (success) {
      Logger.info('Workspace Ownership transferred successfully!')
      Logger.info(`New owner email: ${newOwnerEmail}`)
      Logger.info(`Workspace slug: ${workspaceSlug}`)
    } else {
      Logger.error(`Failed to transfer ownership: ${error.message}`)
    }
  }
}
