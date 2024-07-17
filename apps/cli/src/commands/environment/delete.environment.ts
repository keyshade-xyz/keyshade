import BaseCommand from '../base.command'
import { spinner } from '@clack/prompts'
import { EnvironmentController } from '@keyshade/api-client'
import {
  CommandActionData,
  CommandArgument,
  CommandOption
} from 'src/types/command/command.types'

export class DeleteEnvironment extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete an environment'
  }

  getOptions(): CommandOption[] {
    return []
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
      console.error('Environment ID is required')
      return
    }

    const apiKey = this.apiKey

    const headers = {
      'x-keyshade-token': apiKey
    }

    const spin = spinner()

    try {
      await EnvironmentController.deleteEnvironment(
        { id: environmentId },
        headers
      )
      spin.stop(`Environment ${environmentId} has been deleted successfully.`)
    } catch (error) {
      console.error(error.message)
    }
  }
}
