import BaseCommand from '../base.command'
import { spinner, text, intro, outro } from '@clack/prompts'
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
        long: '--desc <string>',
        description: 'Description about the Environment'
      }
    ]
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project ID>',
        description:
          'ID of the project under which you want to add the environment'
      }
    ]
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const [projectId] = args
    const { name, description } = await this.parseInput(options)

    if (!projectId) {
      console.error('Project ID is required')
      return
    }

    const apiKey = this.apiKey

    const environmentData = {
      name,
      description,
      projectId
    }

    const headers = {
      'x-keyshade-token': apiKey
    }

    const spin = spinner()
    try {
      intro('Creating Environment')
      const createdEnvironment = await EnvironmentController.createEnvironment(
        environmentData,
        headers
      )
      spin.message(`- Name: ${createdEnvironment.name}`)
      spin.message(`- ID: ${createdEnvironment.id}`)
      outro('Environment Created Successfully.')
      spin.stop()
    } catch (error) {
      Logger.error(error.message as string)
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
