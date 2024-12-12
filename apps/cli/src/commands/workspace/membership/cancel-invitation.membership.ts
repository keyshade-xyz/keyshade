import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class CancelInvitationCommand extends BaseCommand {
  getName(): string {
    return 'cancel-invitation'
  }

  getDescription(): string {
    return 'Cancel invitation sent to a user'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to fetch.'
      },
      {
        name: '<Invitee Email>',
        description: 'Email of the user that was invited.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug, userEmail] = args

    const { error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.cancelInvitation(
        {
          workspaceSlug,
          userEmail
        },
        this.headers
      )

    if (success) {
      Logger.info('Cancelled an invitation for workspace successfully!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
      Logger.info(`Invitee: ${userEmail}`)
    } else {
      Logger.error(`Failed to cancel invitation: ${error.message}`)
    }
  }
}
