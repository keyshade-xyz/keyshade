import BaseCommand from '../base.command'
import { text } from '@clack/prompts'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from 'src/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export class CreateEnvironment extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Create a new environment'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the Environment'
      },
      {
        short: '-d',
        long: '--description <string>',
        description: 'Description about the Environment'
      }
    ]
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description:
          'Slug of the project under which you want to add the environment'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { name, description } = await this.parseInput(options)

    if (!projectSlug) {
      Logger.error('Project slug is required')
      return
    }

    Logger.info('Creating Environment...')

    const {
      data: environment,
      error,
      success
    } = await ControllerInstance.getInstance().environmentController.createEnvironment(
      { name, description, projectSlug },
      this.headers
    )

    if (success) {
      Logger.info(
        `Environment created:${environment.name} (${environment.slug})`
      )
    } else {
      this.logError('Failed to create environment', error)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name: string
    description?: string
  }> {
    let { name } = options
    const { description } = options

    if (!name) {
      name = await text({
        message: 'Enter the name of the Environment',
        placeholder: 'env'
      })
    }

    return { name, description }
  }
}
