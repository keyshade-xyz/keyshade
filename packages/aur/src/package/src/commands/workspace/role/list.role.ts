import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'
import { PAGINATION_OPTION } from '@/util/pagination-options'

export default class ListRoleCommand extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all roles of a workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace whose roles you want.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return PAGINATION_OPTION
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    Logger.info("Fetching workspace's roles...")

    const [workspaceSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().workspaceRoleController.getWorkspaceRolesOfWorkspace(
        {
          workspaceSlug,
          ...options
        },
        this.headers
      )

    if (success) {
      Logger.info('Workspace Roles fetched successfully:')
      const roles = data.items
      if (roles.length > 0) {
        roles.forEach((role: any) => {
          Logger.info(`- ${role.name} (${role.slug})`)
        })
      } else {
        Logger.info('No roles found')
      }
    } else {
      this.logError(error)
    }
  }
}
