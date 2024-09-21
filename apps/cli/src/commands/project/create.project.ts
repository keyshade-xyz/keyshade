import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import { text } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class CreateProject extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Creates a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description:
          'Slug of the workspace under which you want to create the project'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the project'
      },
      {
        short: '-d',
        long: '--description <string>',
        description: 'Description of the project. Defaults to project name'
      },
      {
        short: '-k',
        long: '--store-private-key',
        description: 'Store the private key in the project. Defaults to true',
        defaultValue: true
      },
      {
        short: '-a',
        long: '--access-level <string>',
        description: 'Access level of the project. Defaults to PRIVATE.',
        defaultValue: 'PRIVATE',
        choices: ['GLOBAL', 'PRIVATE', 'INTERNAL']
      }
    ]
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args

    const parsedData = await this.parseOptions(options)

    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.createProject(
        {
          workspaceSlug,
          ...parsedData
        },
        this.headers
      )

    if (success) {
      Logger.info(`Project ${data.name} (${data.slug}) created successfully!`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
    } else {
      Logger.error(`Failed to create project: ${error.message}`)
    }
  }

  async parseOptions(options: CommandActionData['options']): Promise<{
    name: string
    description?: string
    storePrivateKey: boolean
    accessLevel: string
  }> {
    let { name, description } = options
    const { storePrivateKey, accessLevel } = options

    if (!name) {
      name = await text({
        message: 'Enter the name of the Project',
        placeholder: 'My Project'
      })
    }

    if (!description) {
      description = name
    }

    return { name, description, storePrivateKey, accessLevel }
  }
}
