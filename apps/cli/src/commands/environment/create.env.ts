import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import { EnvironmentData } from 'src/types/command/environment.types'
import { text } from '@clack/prompts'
import EnvironmentController from '../../../../../packages/api-client/src/controllers/environment/environment'
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
    const [project_id] = args
    const { name, description } = await this.parseInput(options)

    if (!project_id) {
      Logger.error('Project ID is required')
      return
    }

    const baseUrl = this.baseUrl
    const apiKey = this.apiKey

    const environmentData: EnvironmentData = {
      name: name,
      description: description,
      project_id: project_id
    }

    const headers = {
      baseUrl,
      apiKey
    }

    try {
      const createdEnvironment = await EnvironmentController.createEnvironment(
        environmentData,
        headers
      )
      Logger.log(`Created environment:`)
      Logger.log(`- Name: ${createdEnvironment.name}`)
      Logger.log(`- ID: ${createdEnvironment.id}`)
      Logger.log(`- API Key: ${createdEnvironment.apiKey}`)
      Logger.log(`- Base URL: ${createdEnvironment.baseUrl}`)
    } catch (error) {
      Logger.error(error.message)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name: string
    description?: string
  }> {
    let { name, description } = options

    if (!name) {
      name = await text({
        message: 'Enter the name of the Environment',
        placeholder: 'env'
      })
    }

    return { name, description }
  }
}
