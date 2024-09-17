import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class ListWorkspace extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'Fetches all the workspace you have access to'
  }

  async action(): Promise<void> {
    Logger.info('Fetching all workspaces...')

    const { success, data, error } =
      await ControllerInstance.getInstance().workspaceController.getWorkspacesOfUser(
        {},
        this.headers
      )

    if (success) {
      data.items.forEach((workspace: any) => {
        Logger.info(`- ${workspace.name} (${workspace.slug})`)
      })
    } else {
      Logger.error(`Failed fetching workspaces: ${error.message}`)
    }
  }
}
