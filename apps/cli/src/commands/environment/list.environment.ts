import BaseCommand from '../base.command'
import { EnvironmentController } from '@keyshade/api-client'
import { spinner, outro } from '@clack/prompts'
import {
  type CommandActionData,
  type CommandArgument
} from 'src/types/command/command.types'
import { Logger } from '@/util/logger'

export class ListEnvironment extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all environments under a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project ID>',
        description: 'ID of the project whose environments you want.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectId] = args

    if (!projectId) {
      Logger.error('Project ID is required')
      return
    }

    const apiKey = this.apiKey

    const headers = {
      'x-keyshade-token': apiKey
    }

    if (!apiKey) {
      Logger.error('Base URL and API Key must be set as environment variables')
      return
    }

    try {
      const spin = spinner()
      spin.start(`Getting all Environment for Project ${projectId}`)
      const environments =
        await EnvironmentController.getAllEnvironmentsOfProject(
          { projectId },
          headers
        )
      spin.message(`Environments for project ${projectId}:`)
      spin.message(JSON.stringify(environments))
      outro('Fetched all Environments.')
      spin.stop()
    } catch (error) {
      Logger.error(error.message as string)
    }
  }
}
