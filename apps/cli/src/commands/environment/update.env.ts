import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import { EnvironmentController } from '@keyshade/api-client'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import {
  UpdateEnvironmentRequest,
  UpdateEnvironmentResponse
} from '../../../../../packages/api-client/src/types/environment.types'

export class UpdateEnvironment extends BaseCommand {
  getName(): string {
    return 'update'
  }
  getDescription(): string {
    return 'Update a environment'
  }

  getOptions(): CommandOption[] {
    return []
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const [environmentId] = args
    const { name, description } = options

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

    const environmentData: UpdateEnvironmentRequest = {
      name: name,
      description: description,
      id: environmentId
    }

    try {
      const environments: UpdateEnvironmentResponse =
        await EnvironmentController.updateEnvironment(environmentData, headers)
      Logger.log(`Environments for project ${environmentId}:`)
      environments.forEach((environment: any) => {
        Logger.log(`- ${environment.name} (ID: ${environment.id})`)
      })
    } catch (error) {
      Logger.error(error.message)
    }
  }
}
