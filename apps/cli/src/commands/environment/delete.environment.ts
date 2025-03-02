import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandActionData,
  type CommandArgument
} from 'src/types/command/command.types'
import { Logger } from '@/util/logger'

export class DeleteEnvironment extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete an environment'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Environment ID>',
        description: 'ID of the environment which you want to delete.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [environmentSlug] = args

    if (!environmentSlug) {
      Logger.error('Environment Slug is required')
      return
    }

    Logger.info('Deleting Environment...')

    const { success, error } =
      await ControllerInstance.getInstance().environmentController.deleteEnvironment(
        { slug: environmentSlug },
        this.headers
      )

    if (success) {
      Logger.info('Environment deleted successfully')
    } else {
      this.logError(error)
    }
  }
}
