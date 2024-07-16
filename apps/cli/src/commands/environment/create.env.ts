import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import { text } from '@clack/prompts'
import { EnvironmentController } from '@keyshade/api-client'
import {
  CreateEnvironmentRequest,
  CreateEnvironmentResponse
} from '../../../../../packages/api-client/src/types/environment.types'
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

  async action({ options, args }: CommandActionData): Promise<void> {
    const [projectId] = args
    const { name, description } = await this.parseInput(options)

    if (!projectId) {
      Logger.error('Project ID is required')
      return
    }

    const baseUrl = this.baseUrl
    const apiKey = this.apiKey

    const environmentData: CreateEnvironmentRequest = {
      name: name,
      description: description,
      projectId: projectId
    }

    const headers = {
      baseUrl,
      apiKey
    }

    try {
      const createdEnvironment: CreateEnvironmentResponse =
        await EnvironmentController.createEnvironment(environmentData, headers)
      Logger.log(`Created environment:`)
      Logger.log(`- Name: ${createdEnvironment.name}`)
      Logger.log(`- ID: ${createdEnvironment.id}`)
    } catch (error) {
      Logger.error(error.message)
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
