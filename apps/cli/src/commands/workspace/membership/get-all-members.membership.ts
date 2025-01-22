import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'
import { PAGINATION_OPTION } from '@/util/pagination-options'

export default class GetAllMembersOfWorkspaceCommand extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all members of a workspace'
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
    Logger.info("Fetching workspace's members...")

    const [workspaceSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().workspaceMembershipController.getMembers(
        {
          workspaceSlug,
          ...options
        },
        this.headers
      )

    if (success) {
      Logger.info('Workspace Members fetched successfully:')
      const members = data.items
      if (members.length > 0) {
        Logger.info('Email\tRole')
        members.forEach((member) => {
          Logger.info(
            `- ${member.user.email} (${member.roles.map((role) => role.role.name).join(', ')})`
          )
        })
      } else {
        Logger.info('No members found')
      }
    } else {
      Logger.error(`Failed fetching members: ${error.message}`)
    }
  }
}
