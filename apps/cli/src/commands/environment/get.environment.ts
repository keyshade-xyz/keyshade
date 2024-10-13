import { Logger } from '@/util/logger'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandActionData,
  type CommandArgument
} from 'src/types/command/command.types'

export class GetEnvironment extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Get an environment'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Environment Slug>',
        description: 'Slug of the environment which you want to fetch.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [environmentSlug] = args

    if (!environmentSlug) {
      Logger.error('Environment slug is required')
      return
    }

    Logger.info('Fetching Environment...')

    const {
      success,
      error,
      data: environment
    } = await ControllerInstance.getInstance().environmentController.getEnvironment(
      { slug: environmentSlug },
      this.headers
    )

    if (success) {
      Logger.info('Environment fetched successfully:')
      Logger.info(
        `Environment Slug: ${environment.slug}, Name: ${environment.name}, Description: ${environment.description}`
      )
    } else {
      Logger.error(`Error fetching environment: ${error.message}`)
    }
  }
}
