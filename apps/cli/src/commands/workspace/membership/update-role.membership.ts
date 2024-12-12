import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class UpdateRolesCommand extends BaseCommand {
  getName(): string {
    return 'update-role'
  }

  getDescription(): string {
    return 'Update roles of a user in workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to fetch.'
      },
      {
        name: '<User Email>',
        description: 'Email of the workspace member.'
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
    const [workspaceSlug, userEmail, ...roleSlugs] = args

    const { error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.updateMemberRoles(
        {
          workspaceSlug,
          userEmail,
          roleSlugs
        },
        this.headers
      )

    if (success) {
      Logger.info('Updated the roles of user!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
      Logger.info(`Member Email: ${userEmail}`)
      Logger.info(`New Roles: ${roleSlugs.join(', ')}`)
    } else {
      Logger.error(`Failed to update roles: ${error.message}`)
    }
  }
}
