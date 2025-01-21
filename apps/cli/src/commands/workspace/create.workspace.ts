import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import { text } from '@clack/prompts'

export default class CreateWorkspace extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Creates a new workspace'
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

  async action({ options }: CommandActionData): Promise<void> {
    const { name, icon } = await this.parseInput(options)

    const { data, error, success } =
      await ControllerInstance.getInstance().workspaceController.createWorkspace(
        {
          name,
          icon
        },
        this.headers
      )

    if (success) {
      Logger.info(`Workspace ${data.name} (${data.slug}) created successfully!`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
    } else {
      Logger.error(`Failed to create workspace: ${error.message}`)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name: string
    icon?: string
  }> {
    let { name } = options
    const { icon } = options

    if (!name) {
      name = await text({
        message: 'Enter the name of the Workspace',
        placeholder: 'My Workspace'
      })
    }

    return { name, icon }
  }
}
