import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class UpdateWorkspace extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates a workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to update.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <Workspace Name>',
        description: 'Name of the workspace.'
      },
      {
        short: '-i',
        long: '--icon <Workspace Icon>',
        description: 'Icon of the workspace.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args
    const { name, icon } = options

    if (name || icon) {
      Logger.info('Updating workspace...')

      const { data, error, success } =
        await ControllerInstance.getInstance().workspaceController.updateWorkspace(
          {
            workspaceSlug,
            name,
            icon
          },
          this.headers
        )

      if (success) {
        Logger.info('Workspace updated successfully:')
        Logger.info(`Workspace: ${data.name} (${data.slug})`)
        Logger.info(`Created at: ${data.createdAt}`)
        Logger.info(`Updated at: ${data.updatedAt}`)
        Logger.info(`Is default workspace: ${data.isDefault}`)
      } else {
        this.logError('Failed updating workspace', error)
      }
    } else {
      Logger.info('No data provided. Skipping update.')
    }
  }
}
