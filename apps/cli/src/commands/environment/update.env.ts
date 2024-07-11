import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import EnvironmentController from '../../../../../packages/api-client/src/controllers/environment/environment'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import { EnvironmentData } from 'src/types/command/environment.types'

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
    const [environment_id] = args
    const { name, description } = options

    if (!environment_id) {
      Logger.error('Environment ID is required')
      return
    }

    const baseUrl = this.baseUrl
    const apiKey = this.apiKey

    const headers = {
      baseUrl,
      apiKey
    }

    const environmentData: EnvironmentData = {
      name: name,
      description: description,
      environment_id: environment_id
    }

    try {
      const environments = await EnvironmentController.updateEnvironment(
        environmentData,
        headers
      )
      Logger.log(`Environments for project ${environment_id}:`)
      environments.forEach((environment: any) => {
        Logger.log(`- ${environment.name} (ID: ${environment.id})`)
      })
    } catch (error) {
      Logger.error(error.message)
    }
  }
}
