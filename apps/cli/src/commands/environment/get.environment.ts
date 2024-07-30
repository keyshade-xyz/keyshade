import { Logger } from '@/util/logger'
import BaseCommand from '../base.command'
import { spinner, intro, outro } from '@clack/prompts'
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
      console.error('Environment ID is required')
      return
    }

    const apiKey = this.apiKey

    const headers = {
      'x-keyshade-token': apiKey
    }

    const spin = spinner()
    try {
      intro('Getting Environment...')
      const environment = await EnvironmentController.getEnvironmentById(
        { id: environmentId },
        headers
      )
      spin.start(`Environment ${environmentId}:`)
      spin.message(`- Name: ${environment.name}`)
      spin.message(`- Description: ${environment.description}`)
      outro('Successfully Fetched the Environment.')
      spin.stop()
    } catch (error) {
      Logger.error(error.message as string)
    }
  }
}
