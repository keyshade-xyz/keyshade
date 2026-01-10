import { Logger } from '@/util/logger'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandActionData,
  type CommandArgument
} from 'src/types/command/command.types'
import {
  GetEnvironmentRequestSchema,
  GetEnvironmentResponseSchema
} from '@keyshade/schema/raw'

export class GetEnvironment extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Get an environment'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Environment Slug>',
        description: 'Slug of the environment which you want to fetch.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [environmentSlug] = args

    const request = GetEnvironmentRequestSchema.safeParse({
      slug: environmentSlug
    })
    if (!request.success) {
      Logger.error(request.error.toString())
      return
    }

    Logger.info('Fetching Environment...')

    const {
      success,
      error,
      data: environment
    } = await ControllerInstance.getInstance().environmentController.getEnvironment(
      request.data,
      this.headers
    )

    if (!success) {
      this.logError(error)
      return
    }

    const response = GetEnvironmentResponseSchema.safeParse(environment)
    if (response.success) {
      Logger.info(`Name: ${environment.name}`)
      Logger.info(`Slug: ${environment.slug}`)
      Logger.info(`Description: ${environment.description}`)
      Logger.info(`Created On: ${environment.createdAt}`)
      Logger.info(`Updated On: ${environment.updatedAt}`)
    } else {
      Logger.error('Invalid server response')
    }
  }
}
