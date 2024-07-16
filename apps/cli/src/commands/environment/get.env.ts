import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import { EnvironmentController } from '@keyshade/api-client'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import { GetEnvironmentByIdResponse } from '../../../../../packages/api-client/src/types/environment.types'

export class GetEnvironment extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Get an environment'
  }

  getOptions(): CommandOption[] {
    return []
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [environmentId] = args

    if (!environmentId) {
      Logger.error('Environment ID is required')
      return
    }

    const baseUrl = this.baseUrl
    const apiKey = this.apiKey

    const headers = {
      baseUrl,
      apiKey
    }

    try {
      const environment: GetEnvironmentByIdResponse =
        await EnvironmentController.getEnvironmentById(
          { id: environmentId },
          headers
        )
      Logger.log(`Environment ${environmentId}:`)
      Logger.log(`- Name: ${environment.name}`)
      Logger.log(`- Description: ${environment.description}`)
    } catch (error) {
      Logger.error(error.message)
    }
  }
}
