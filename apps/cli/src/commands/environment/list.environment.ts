import BaseCommand from '../base.command'
import { EnvironmentController } from '@keyshade/api-client'
import { intro, spinner } from '@clack/prompts'
import {
  CommandActionData,
  CommandArgument
} from 'src/types/command/command.types'

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
        description: 'ID of the project under which you want to add the en'
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
      const environments =
        await EnvironmentController.getAllEnvironmentsOfProject(
          { projectId },
          headers
        )
      spin.start(`Environments for project ${projectId}:`)
      environments.forEach((environment: any) => {
        spin.message(
          `- ${environment.name} (Description: ${environment.description})`
        )
      })
    } catch (error) {
      console.error(error.message)
    }
  }
}
