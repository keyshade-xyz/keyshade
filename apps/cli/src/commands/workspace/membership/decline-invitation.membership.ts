import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class DeclineInvitationCommand extends BaseCommand {
  getName(): string {
    return 'decline-invitation'
  }

  getDescription(): string {
    return 'Decline invitation of a workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to fetch.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.declineInvitation(
        {
          workspaceSlug
        },
        this.headers
      )

    if (success) {
      Logger.info('Declined invitation sucessfully!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
    } else {
      Logger.error(`Failed to decline invitation: ${error.message}`)
    }
  }
}
