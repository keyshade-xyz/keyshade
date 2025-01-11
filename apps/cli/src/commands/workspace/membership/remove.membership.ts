import BaseCommand from '@/commands/base.command'
import type {
  CommandOption,
  CommandActionData,
  CommandArgument
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
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--emails <string>',
        description: 'Comma separated list of emails of the users to remove.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args
    const { emails } = options

    const { error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.removeUsers(
        {
          workspaceSlug,
          userEmails: emails.split(',')
        },
        this.headers
      )

    if (success) {
      Logger.info('Removed user from workspace successfully!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
      Logger.info(`Email: ${emails}`)
    } else {
      Logger.error(`Failed to remove users: ${error.message}`)
    }
  }
}
