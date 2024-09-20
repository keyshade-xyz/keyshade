import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'
import { CommandActionData, CommandOption } from '@/types/command/command.types'

export default class ListWorkspace extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'Fetches all the workspace you have access to'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-p',
        long: '--page <page>',
        description: 'Index of the page.'
      },
      {
        short: '-l',
        long: '--limit <items>',
        description: 'Total number of items per page.'
      },
      {
        short: '-o',
        long: '--order <sort order>',
        description:
          'Order to sort by - either ascending (ASC) or descending (DESC).'
      },
      {
        short: '--sort',
        long: '--sort <field name>',
        description: 'Field to sort by.'
      },
      {
        short: '-s',
        long: '--search <search>',
        description: 'Search term.'
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    Logger.info('Fetching all workspaces...')

    const { page, limit, order, sort, search } = options

    const { success, data, error } =
      await ControllerInstance.getInstance().workspaceController.getWorkspacesOfUser(
        {
          page,
          limit,
          order,
          sort,
          search
        },
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
