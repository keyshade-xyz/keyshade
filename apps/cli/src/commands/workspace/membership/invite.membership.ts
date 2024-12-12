import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
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
      },
      {
        name: '<Invitee Email>',
        description: 'Email of the user to invite.'
      },
      {
        name: '<Role Slugs>',
        description: 'Space-separated list of role slugs to assign to the user.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug, email, ...roleSlugs] = args

    const { error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.inviteUsers(
        {
          workspaceSlug,
          members: [
            {
              email,
              roleSlugs
            }
          ]
        },
        this.headers
      )

    if (success) {
      Logger.info('Invited to workspace successfully!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
      Logger.info(`Invitee: ${email}`)
      Logger.info(`Roles: ${roleSlugs.join(', ')}`)
    } else {
      Logger.error(`Failed to invite user: ${error.message}`)
    }
  }
}
