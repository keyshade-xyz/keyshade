import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import EnvironmentController from '../../http/project'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'

export class ListEnvironment extends BaseCommand {
  private environmentController = new EnvironmentController()

  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all environments under a project'
  }

  getOptions(): CommandOption[] {
    return []
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [project] = args

    if (!project) {
      Logger.error('Project ID is required')
      return
    }

    const baseUrl = process.env.BASE_URL
    const apiKey = process.env.API_KEY

    if (!baseUrl || !apiKey) {
      Logger.error('Base URL and API Key must be set as environment variables')
      return
    }

    try {
      const environments =
        await this.environmentController.getAllEnvironmentByProjectId(
          baseUrl,
          apiKey,
          project
        )
      Logger.log(`Environments for project ${project}:`)
      environments.forEach((environment: any) => {
        Logger.log(
          `- ${environment.name} (Description: ${environment.description})`
        )
      })
    } catch (error) {
      Logger.error(error.message)
    }
  }
}
