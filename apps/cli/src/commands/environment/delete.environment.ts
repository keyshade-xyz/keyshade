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

  async action({ args }: CommandActionData): Promise<void> {
    const [environmentId] = args

    if (!environmentId) {
      Logger.error('Environment ID is required')
      return
    }

    Logger.info('Deleting Environment...')

    const { success, error } = await ControllerInstance
    .getInstance()
    .environmentController.deleteEnvironment(
      { id: environmentId },
      this.headers
    )

    if (success) {
      Logger.info('Environment deleted successfully')
    } else {
      Logger.error(`Error deleting environment: ${error.message}`)
    }
  }
}
