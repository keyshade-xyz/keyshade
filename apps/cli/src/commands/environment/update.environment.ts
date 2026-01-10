import { Logger } from '@/util/logger'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from 'src/types/command/command.types'
import {
  UpdateEnvironmentRequestSchema,
  UpdateEnvironmentResponseSchema
} from '@keyshade/schema/raw'

export class UpdateEnvironment extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Update a environment'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the Environment'
      },
      {
        short: '-d',
        long: '--description <string>',
        description: 'Description about the Environment'
      }
    ]
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Environment Slug>',
        description: 'Slug of the environment which you want to update.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const [environmentSlug] = args
    const { name, description } = options

    const request = UpdateEnvironmentRequestSchema.safeParse({
      name,
      description,
      slug: environmentSlug
    })
    if (!request.success) {
      Logger.error(request.error.toString())
      return
    }

    Logger.info('Updating Environment...')

    const {
      success,
      error,
      data: environment
    } = await ControllerInstance.getInstance().environmentController.updateEnvironment(
      request.data,
      this.headers
    )

    if (!success) {
      this.logError(error)
      return
    }

    const response = UpdateEnvironmentResponseSchema.safeParse(environment)
    if (response.success) {
      Logger.info('Environment updated successfully')
      Logger.info(
        `Environment Slug: ${environment.slug}, Name: ${environment.name}, Description: ${environment.description}`
      )
    } else {
      Logger.error('Invalid server response')
    }
  }
}
