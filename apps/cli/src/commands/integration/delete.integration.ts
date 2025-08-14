import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandOption,
  type CommandActionData
} from 'src/types/command/command.types'
import { Logger } from '@/util/logger'

export class DeleteIntegration extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete an integration'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-c',
        long: '--clean-up',
        description: 'Makes the integration clean up the data that it created.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [integrationSlug] = args

    if (!integrationSlug) {
      Logger.error('Integration Slug is required')
      return
    }

    Logger.info('Deleting Integration...')

    const { success, error } =
      await ControllerInstance.getInstance().integrationController.deleteIntegration(
        { integrationSlug },
        this.headers
      )

    if (success) {
      Logger.info('Integration deleted successfully')
    } else {
      this.logError(error)
    }
  }
}
