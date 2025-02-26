import BaseCommand from '@/commands/base.command'
import type {
  CommandOption,
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class InviteUserCommand extends BaseCommand {
  getName(): string {
    return 'invite'
  }

  getDescription(): string {
    return 'Invite a user to a workspace'
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
      },
      {
        short: '-r',
        long: '--roles <string>',
        description: 'Comma-separated list of role slugs to assign to the user.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args
    const { email, roles } = options

    const { error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.inviteUsers(
        {
          workspaceSlug,
          members: [
            {
              email,
              roleSlugs: roles.split(',')
            }
          ]
        },
        this.headers
      )
    if (success) {
      Logger.info('Invited to workspace successfully!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
      Logger.info(`Invitee: ${email}`)
      Logger.info(`Roles: ${roles}`)
    } else {
      this.logError(error)
    }
  }
}
