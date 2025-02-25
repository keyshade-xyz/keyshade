import { Logger } from '@/util/logger'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from 'src/types/command/command.types'

export class UpdateEnvironment extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Update a environment'
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
        name: '<Environment Slug>',
        description: 'Slug of the environment which you want to update.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const [environmentSlug] = args
    const { name, description } = options

    if (!environmentSlug) {
      Logger.error('Environment slug is required')
      return
    }

    Logger.info('Updating Environment...')

    const {
      success,
      error,
      data: environment
    } = await ControllerInstance.getInstance().environmentController.updateEnvironment(
      { name, description, slug: environmentSlug },
      this.headers
    )

    if (success) {
      Logger.info('Environment updated successfully')
      Logger.info(
        `Environment Slug: ${environment.slug}, Name: ${environment.name}, Description: ${environment.description}`
      )
    } else {
      this.logError('Error updating Environment', error)
    }
  }
}
