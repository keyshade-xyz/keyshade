import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class RemoveUserCommand extends BaseCommand {
  getName(): string {
    return 'remove'
  }

  getDescription(): string {
    return 'Remove a user from a workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to fetch.'
      },
      {
        name: '<User Email>',
        description: 'Email of the user to remove.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug, email] = args

    const { error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.removeUsers(
        {
          workspaceSlug,
          userEmails: email
        },
        this.headers
      )

    if (success) {
      Logger.info('Removed user from workspace successfully!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
      Logger.info(`User email: ${email}`)
    } else {
      Logger.error(`Failed to remove user: ${error.message}`)
    }
  }
}
