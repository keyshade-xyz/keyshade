import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import EnvironmentController from '../../http/project'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import { EnvironmentData } from 'src/types/command/environment.types'

export class UpdateEnvironment extends BaseCommand {
  private environmentController = new EnvironmentController()

  getName(): string {
    return 'update'
  }
  getDescription(): string {
    return 'Update a environment'
  }

  getOptions(): CommandOption[] {
    return []
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [environment_id] = args

    if (!environment_id) {
      Logger.error('Environment ID is required')
      return
    }

    const baseUrl = process.env.BASE_URL
    const apiKey = process.env.API_KEY

    const environmentData: EnvironmentData = {
      name: '',
      description: ''
    }

    try {
      const environments = await this.environmentController.updateEnvironment(
        baseUrl,
        apiKey,
        environment_id,
        environmentData
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
