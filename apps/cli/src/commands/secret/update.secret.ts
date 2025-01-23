import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class UpdateSecret extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates a secret'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Secret Slug>',
        description: 'Slug of the secret that you want to update'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the secret'
      },
      {
        short: '-d',
        long: '--note <string>',
        description: ' An optional note describing the usage of the secret.'
      },
      {
        short: '-r',
        long: '--rotate-after',
        description:
          'The duration in days after which the value of the secret should be rotated. Accepted values are `24`, `168`, `720`, `8769` and `never`. Defaults to `never`.',
        defaultValue: 'never'
      },
      {
        short: '-e',
        long: '--entries [entries...]',
        description: 'An array of values for the secret.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [secretSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().secretController.updateSecret(
        {
          secretSlug,
          ...options
        },
        this.headers
      )

    if (success) {
      Logger.info('Secret updated successfully')
    } else {
      Logger.error(`Failed to update secret: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed to update secret.\n' + JSON.stringify(error))
      }
    }
  }
}
