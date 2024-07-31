import BaseCommand from '../base.command'
import { outro, spinner } from '@clack/prompts'
import { EnvironmentController } from '@keyshade/api-client'
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

    const apiKey = this.apiKey

    const headers = {
      'x-keyshade-token': apiKey
    }

    try {
      const spin = spinner()
      spin.start('Deleting Environment...')
      await EnvironmentController.deleteEnvironment(
        { id: environmentId },
        headers
      )
      outro(`Environment ${environmentId} has been deleted successfully.`)
    } catch (error) {
      Logger.info(error.message as string)
    }
  }
}
