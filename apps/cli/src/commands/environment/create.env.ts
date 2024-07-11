import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import EnvironmentController from '../../http/project'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import { EnvironmentData } from 'src/types/command/environment.types'
import {text} from '@clack/prompts'
export class CreateEnvironment extends BaseCommand {
  private environmentController = new EnvironmentController()

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
    const {name, description} = await this.parseInput(options)

    if (!project_id) {
      Logger.error('Project ID is required')
      return
    }

    const baseUrl = this.baseUrl
    const apiKey = this.apiKey  

    const environmentData: EnvironmentData = {
      name: name,
      description: description
    }

    try {
      const createdEnvironment =
        await this.environmentController.createEnvironment(
          baseUrl,
          apiKey,
          project_id,
          environmentData
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
    description?: string,
  }> {
    let { name, description } = options

    if (!name) {
      name = await text({
        message: 'Enter the name of the Environment',
        placeholder: 'env'
      })
    }

    let apiKey = this.apiKey as string | symbol; 

    if (!apiKey) {
      apiKey = await text({
        message: 'Enter the private key for the profile',
        placeholder: 'ks_************'
      })
    }

    return { name,description }
  }
}
