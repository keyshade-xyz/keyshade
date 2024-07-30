import BaseCommand from '../base.command'
import { EnvironmentController } from '@keyshade/api-client'
import { intro, spinner, outro } from '@clack/prompts'
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
      console.error('Project ID is required')
      return
    }

    const apiKey = this.apiKey

    const headers = {
      'x-keyshade-token': apiKey
    }

    if (!apiKey) {
      console.error('Base URL and API Key must be set as environment variables')
      return
    }

    intro(`Fetching environments for project ${projectId}...`)

    const spin = spinner()

    try {
      intro(`Getting all Environment for Project ${projectId}`)
      const environments =
        await EnvironmentController.getAllEnvironmentsOfProject(
          { projectId },
          headers
        )
      spin.start(`Environments for project ${projectId}:`)
      spin.message(JSON.stringify(environments))
      outro('Fetched all Environments.')
      spin.stop()
    } catch (error) {
      Logger.error(error.message as string)
    }
  }
}
