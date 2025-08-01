import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class DisableSecret extends BaseCommand {
  getName(): string {
    return 'disable'
  }

  getDescription(): string {
    return 'Disables a secret'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Secret Slug>',
        description: 'Slug of the secret that you want to disable'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--environment <string>',
        description:
          'Environment slug of the environment where the secret should be disabled'
      }
    ]
  }

  getUsage(): string {
    return `keyshade secret disable <secret slug> [options]
    
  Disable secret for a given environment
  keyshade secret disable secret-1 --environment local-3
    `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [secretSlug] = args
    const environmentSlug = await this.parseInput(options)

    const { error, success } =
      await ControllerInstance.getInstance().secretController.disableSecret(
        {
          secretSlug,
          environmentSlug
        },
        this.headers
      )

    if (success) {
      Logger.info('Secret disabled successfully')
    } else {
      this.logError(error)
    }
  }

  async parseInput(options: CommandActionData['options']): Promise<string> {
    const environmentSlug = options.environment || options.e

    if (!environmentSlug) {
      Logger.error('Environment slug is required')
      process.exit(1)
    }

    return environmentSlug
  }
}
