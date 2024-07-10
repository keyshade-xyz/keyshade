import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import EnvironmentController from '../../http/project'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import { EnvironmentData } from 'src/types/command/environment.types'

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

  async action({ args }: CommandActionData): Promise<void> {
    const [project_id] = args

    if (!project_id) {
      Logger.error('Project ID is required')
      return
    }

    const baseUrl = process.env.BASE_URL
    const apiKey = process.env.API_KEY

    const environmentData: EnvironmentData = {
      name: '',
      description: ''
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
}
