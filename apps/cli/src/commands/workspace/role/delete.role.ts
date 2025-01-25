import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class DeleteRoleCommand extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete workspace role'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Role Slug>',
        description: 'Slug of the workspace role you want to delete.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceRoleSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().workspaceRoleController.deleteWorkspaceRole(
        {
          workspaceRoleSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(`Workspace role ${workspaceRoleSlug} deleted successfully!`)
    } else {
      Logger.error(`Failed deleting workspace role: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report(
          'Failed deleting workspace role.\n' + JSON.stringify(error)
        )
      }
    }
  }
}
