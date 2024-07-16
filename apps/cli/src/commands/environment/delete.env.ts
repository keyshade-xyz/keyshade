import BaseCommand from '../base.command'
import Logger from '../../util/logger'
import { EnvironmentController } from '@keyshade/api-client'
import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'

export class DeleteEnvironment extends BaseCommand {
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
      await EnvironmentController.deleteEnvironment(
        { id: environmentId },
        headers
      )
      Logger.log(`Environment ${environmentId} has been deleted successfully.`)
    } catch (error) {
      Logger.error(error.message)
    }
  }
}
