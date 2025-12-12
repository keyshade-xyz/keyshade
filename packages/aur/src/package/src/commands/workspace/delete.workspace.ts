import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class DeleteWorkspace extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Deletes an existing workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to delete.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().workspaceController.deleteWorkspace(
        {
          workspaceSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(`Workspace ${workspaceSlug} deleted successfully!`)
    } else {
      this.logError(error)
    }
  }
}
