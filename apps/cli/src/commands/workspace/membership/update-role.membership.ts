import BaseCommand from '@/commands/base.command'
import type {
  CommandOption,
  CommandActionData,
  CommandArgument
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
        name: '<Role Slugs...>',
        description: 'Space-separated list of role slugs to assign to the user.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--email <string>',
        description: 'Email of the user to update.'
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
      await ControllerInstance.getInstance().workspaceMembershipController.updateMemberRoles(
        {
          workspaceSlug,
          userEmail: email,
          roleSlugs: roles.split(',')
        },
        this.headers
      )

    if (success) {
      Logger.info('Updated the roles of user!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
      Logger.info(`Member Email: ${email}`)
      Logger.info(`New Roles: ${roles}`)
    } else {
      Logger.error(`Failed to update roles: ${error.message}`)
    }
  }
}
