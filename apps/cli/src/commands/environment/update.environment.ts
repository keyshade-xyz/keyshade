import { Logger } from '@/util/logger'
import BaseCommand from '../base.command'
import { spinner, intro, outro } from '@clack/prompts'
import { EnvironmentController } from '@keyshade/api-client'
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
        long: '--desc <string>',
        description: 'Description about the Environment'
      }
    ]
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Environment ID>',
        description: 'ID of the environment which you want to update.'
      }
    ]
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const [environmentId] = args
    const { name, description } = options

    if (!environmentId) {
      console.error('Environment ID is required')
      return
    }

    const apiKey = this.apiKey

    const headers = {
      'x-keyshade-token': apiKey
    }

    const environmentData = {
      name,
      description,
      id: environmentId
    }

    const spin = spinner()

    try {
      intro('Updating Environment...')
      const environments = await EnvironmentController.updateEnvironment(
        environmentData,
        headers
      )
      spin.start(`Environments for project ${environmentId}:`)
      spin.message(JSON.stringify(environments))
      outro('Successfully Updated The Environment')
      spin.stop()
    } catch (error) {
      Logger.error(error.message as string)
    }
  }
}
