import BaseCommand from '@/commands/base.command'
import type {
  CommandOption,
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class ResendInvitationCommand extends BaseCommand {
  getName(): string {
    return 'resend-invitation'
  }

  getDescription(): string {
    return 'Resend an invitation to a user to join a workspace.'
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
        long: '--email <string>',
        description: 'Email of the user to invite.'
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
      await ControllerInstance.getInstance().workspaceMembershipController.resendInvitation(
        {
          workspaceSlug,
          userEmail: email
        },
        this.headers
      )
    if (success) {
      Logger.info('Resent the invitation to the workspace successfully!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
      Logger.info(`Invitee: ${email}`)
    } else {
      this.logError(error)
    }
  }
}
