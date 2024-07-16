import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import { EnvironmentController } from '@keyshade/api-client'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import { GetAllEnvironmentsOfProjectResponse } from '../../../../../packages/api-client/src/types/environment.types'

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
    const [projectId] = args

    if (!projectId) {
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
      const environments: GetAllEnvironmentsOfProjectResponse =
        await EnvironmentController.getAllEnvironmentsOfProject(
          { projectId },
          headers
        )
      Logger.log(`Environments for project ${projectId}:`)
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
