import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class EnableVariable extends BaseCommand {
  getName(): string {
    return 'enable'
  }

  getDescription(): string {
    return 'Enables a disabled variable'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Variable Slug>',
        description: 'Slug of the variable that you want to enable'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--environment <string>',
        description:
          'Environment slug of the environment where the variable should be enabled'
      }
    ]
  }

  getUsage(): string {
    return `keyshade variable enable <variable slug> [options]
    
  Enable variable for a given environment
  keyshade variable enable variable-1 --environment local-3
    `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [variableSlug] = args
    const environmentSlug = await this.parseInput(options)

    const { error, success } =
      await ControllerInstance.getInstance().variableController.enableVariable(
        {
          variableSlug,
          environmentSlug
        },
        this.headers
      )

    if (success) {
      Logger.info('Variable enabled successfully')
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
