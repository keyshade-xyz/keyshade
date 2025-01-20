import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import { PAGINATION_OPTION } from '@/util/pagination-options'

export default class ListWorkspace extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'Fetches all the workspace you have access to'
  }

  getOptions(): CommandOption[] {
    return PAGINATION_OPTION
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options }: CommandActionData): Promise<void> {
    Logger.info('Fetching all workspaces...')

    const { success, data, error } =
      await ControllerInstance.getInstance().workspaceController.getWorkspacesOfUser(
        {
          ...options
        },
        this.headers
      )

    if (success) {
      const workspaces = data.items
      if (workspaces.length > 0) {
        data.items.forEach((workspace: any) => {
          Logger.info(`- ${workspace.name} (${workspace.slug})`)
        })
      } else {
        Logger.info('No workspaces found')
      }
    } else {
      Logger.error(`Failed fetching workspaces: ${error.message}`)
    }
  }
}
