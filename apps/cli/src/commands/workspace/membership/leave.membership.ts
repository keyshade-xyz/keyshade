import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export class LeaveWorkspaceCommand extends BaseCommand {
  getName(): string {
    return 'leave'
  }

  getDescription(): string {
    return 'Leave a workspace'
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
      await ControllerInstance.getInstance().workspaceMembershipController.leaveWorkspace(
        {
          workspaceSlug
        },
        this.headers
      )

    if (success) {
      Logger.info('Left workspace sucessfully!')
      Logger.info(`Workspace slug: ${workspaceSlug}`)
    } else {
      this.logError(error)
    }
  }
}
