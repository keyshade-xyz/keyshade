import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class UpdateVariable extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates a variable'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Variable Slug>',
        description: 'Slug of the variable that you want to update'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the Variable'
      },
      {
        short: '-d',
        long: '--note <string>',
        description: ' An optional note describing the usage of the variable.'
      },
      {
        short: '-e',
        long: '--entries [entries...]',
        description: 'An array of values for the variable.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [variableSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().variableController.updateVariable(
        {
          variableSlug,
          ...options
        },
        this.headers
      )

    if (success) {
      Logger.info('Variable updated successfully!')
    } else {
      Logger.error(`Failed to update variable: ${error.message}`)
    }
  }
}
