import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class EnableSecret extends BaseCommand {
  getName(): string {
    return 'enable'
  }

  getDescription(): string {
    return 'Enables a disabled secret'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Secret Slug>',
        description: 'Slug of the secret that you want to enable'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--environment <string>',
        description:
          'Environment slug of the environment where the secret should be enabled'
      }
    ]
  }

  getUsage(): string {
    return `keyshade secret enable <secret slug> [options]
    
  Enable secret for a given environment
  keyshade secret enable secret-1 --environment local-3
    `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [secretSlug] = args
    const environmentSlug = await this.parseInput(options)

    const { error, success } =
      await ControllerInstance.getInstance().secretController.enableSecret(
        {
          secretSlug,
          environmentSlug
        },
        this.headers
      )

    if (success) {
      Logger.info('Secret enabled successfully')
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
