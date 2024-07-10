import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import EnvironmentController from '../../http/project'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'

export class DeleteEnvironment extends BaseCommand {
  private environmentController = new EnvironmentController()

  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete an environment'
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

    try {
      await this.environmentController.deleteEnvironment(
        baseUrl,
        apiKey,
        environment_id
      )
      Logger.log(`Environment ${environment_id} has been deleted successfully.`)
    } catch (error) {
      Logger.error(error.message)
    }
  }
}
