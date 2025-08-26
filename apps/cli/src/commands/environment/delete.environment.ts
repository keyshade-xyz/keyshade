import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandActionData,
  type CommandArgument
} from 'src/types/command/command.types'
import { Logger } from '@/util/logger'
import {
  DeleteEnvironmentRequestSchema,
  DeleteEnvironmentResponseSchema
} from '@keyshade/schema/raw'

export class DeleteEnvironment extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete an environment'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Environment ID>',
        description: 'ID of the environment which you want to delete.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [environmentSlug] = args

    const request = DeleteEnvironmentRequestSchema.safeParse({
      slug: environmentSlug
    })
    if (!request.success) {
      Logger.error(request.error.toString())
      return
    }

    Logger.info('Deleting Environment...')

    const { success, data, error } =
      await ControllerInstance.getInstance().environmentController.deleteEnvironment(
        request.data,
        this.headers
      )

    if (!success) {
      this.logError(error)
      return
    }

    const response = DeleteEnvironmentResponseSchema.safeParse(data)
    if (response.success) {
      Logger.info('Environment deleted successfully')
    } else {
      Logger.error('Invalid server response')
    }
  }
}
