import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import EnvironmentController from '../../../../../packages/api-client/src/controllers/environment/environment'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'

export class ListEnvironment extends BaseCommand {
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
    const [project_id] = args

    if (!project_id) {
      Logger.error('Project ID is required')
      return
    }

    const baseUrl = this.baseUrl
    const apiKey = this.apiKey

    const headers = {
      baseUrl,
      apiKey
    }

    if (!baseUrl || !apiKey) {
      Logger.error('Base URL and API Key must be set as environment variables')
      return
    }

    try {
      const environments =
        await EnvironmentController.getAllEnvironmentsOfProject(
          { project_id },
          headers
        )
      Logger.log(`Environments for project ${project_id}:`)
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
