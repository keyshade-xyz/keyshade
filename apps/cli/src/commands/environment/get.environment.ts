import { Logger } from '@/util/logger'
import BaseCommand from '../base.command'
import { spinner, outro } from '@clack/prompts'
import { EnvironmentController } from '@keyshade/api-client'
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
        name: '<Environment ID>',
        description: 'ID of the environment which you want to fetch.'
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
      spin.start('Getting Environment...')
      const environment = await EnvironmentController.getEnvironmentById(
        { id: environmentId },
        headers
      )
      spin.message(`Environment ${environmentId}:`)
      spin.message(`- Name: ${environment.name}`)
      spin.message(`- Description: ${environment.description}`)
      outro('Successfully Fetched the Environment.')
      spin.stop()
    } catch (error) {
      Logger.error(error.message as string)
    }
  }
}
