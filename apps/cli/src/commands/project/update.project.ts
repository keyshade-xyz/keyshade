import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class UpdateProject extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project that you want to update'
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

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.updateProject(
        {
          projectSlug,
          ...options
        },
        this.headers
      )

    if (success) {
      Logger.info(`Project ${data.name} (${data.slug}) updated successfully!`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
    } else {
      this.logError('Failed to update project', error)
    }
  }
}
