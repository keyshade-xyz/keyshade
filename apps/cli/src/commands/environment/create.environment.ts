import BaseCommand from '../base.command'
import { text } from '@clack/prompts'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from 'src/types/command/command.types'
import { EnvironmentController } from '@keyshade/api-client'
import { Logger } from '@/util/logger'
export class CreateEnvironment extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Create a new environment'
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
        long: '--description <string>',
        description: 'Description about the Environment'
      }
    ]
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description:
          'Slug of the project under which you want to add the environment'
      }
    ]
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { name, description } = await this.parseInput(options)

    if (!projectSlug) {
      Logger.error('Project slug is required')
      return
    }

    const apiKey = this.apiKey

    const environmentData = {
      name,
      description,
      projectSlug
    }

    const headers = {
      'x-keyshade-token': apiKey
    }

    const environmentController = new EnvironmentController(this.baseUrl)
    Logger.info('Creating Environment...')

    const {
      data: environment,
      error,
      success
    } = await environmentController.createEnvironment(environmentData, headers)

    if (success) {
      Logger.info(
        `Environment created:${environment.name} (${environment.slug})`
      )
    } else {
      Logger.error(`Failed to create environment: ${error.message}`)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name: string
    description?: string
  }> {
    let { name } = options
    const { description } = options

    if (!name) {
      name = await text({
        message: 'Enter the name of the Environment',
        placeholder: 'env'
      })
    }

    return { name, description }
  }
}
