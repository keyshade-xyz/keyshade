import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class ForkProject extends BaseCommand {
  getName(): string {
    return 'fork'
  }

  getDescription(): string {
    return 'Forks a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project which you want to fork.'
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
        short: '-k',
        long: '--store-private-key <boolean>',
        description: 'Store the private key in the project. Defaults to true',
        defaultValue: true
      },
      {
        short: '-w',
        long: '--workspace <string>',
        description: 'Workspace slug to fork the project in'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    console.log(options)

    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.forkProject(
        {
          projectSlug,
          ...options
        },
        this.headers
      )

    if (success) {
      Logger.info(`Project ${data.name} (${data.slug}) forked successfully!`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
    } else {
      this.logError(error)
    }
  }
}
