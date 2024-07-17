import BaseCommand from '../base.command'
import { spinner } from '@clack/prompts'
import {
  CommandActionData,
  CommandArgument,
  CommandOption
} from 'src/types/command/command.types'
import { text } from '@clack/prompts'
import { EnvironmentController } from '@keyshade/api-client'
export class CreateEnvironment extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Create a new environment'
  }

  getOptions(): CommandOption[] {
    return []
  }
  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project ID>',
        description: 'ID of the project under which you want to add the en'
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
      name: name,
      description: description,
      projectId: projectId
    }

    const headers = {
      'x-keyshade-token': apiKey
    }

    const spin = spinner()
    try {
      const createdEnvironment = await EnvironmentController.createEnvironment(
        environmentData,
        headers
      )
      spin.start(`Created environment:`)
      spin.message(`- Name: ${createdEnvironment.name}`)
      spin.message(`- ID: ${createdEnvironment.id}`)
    } catch (error) {
      console.error(error.message)
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
