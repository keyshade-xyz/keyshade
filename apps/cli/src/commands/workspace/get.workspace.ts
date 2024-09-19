import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class GetWorkspace extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Fetches a particular workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to fetch.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args

    Logger.info('Fetching workspace...')

    const { data, error, success } =
      await ControllerInstance.getInstance().workspaceController.getWorkspace(
        {
          workspaceSlug
        },
        this.headers
      )

    if (success) {
      Logger.info('Workspace fetched successfully:')
      Logger.info(`Workspace: ${data.name} (${data.slug})`)
      Logger.info(`Created at: ${data.createdAt}`)
      Logger.info(`Updated at: ${data.updatedAt}`)
      Logger.info(`Is default workspace: ${data.isDefault}`)
    } else {
      Logger.error(`Failed fetching workspace: ${error.message}`)
    }
  }
}
