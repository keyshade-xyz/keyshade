import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class RollbackVariable extends BaseCommand {
  getName(): string {
    return 'rollback'
  }

  getDescription(): string {
    return 'Rollbacks a variable'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Variable Slug>',
        description: 'Slug of the variable that you want to rollback'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-v',
        long: '--version <string>',
        description: 'Version of the variable to which you want to rollback'
      },
      {
        short: '-e',
        long: '--environment <string>',
        description:
          'Slug of the environment of the variable to which you want to rollback'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [variableSlug] = args
    const { environment, version } = await this.parseInput(options)
    const { data, error, success } =
      await ControllerInstance.getInstance().variableController.rollbackVariable(
        {
          environmentSlug: environment,
          version,
          variableSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(
        `Variable rolled back by ${data.count} versions successfully!`
      )
    } else {
      Logger.error(`Failed to update variable: ${error.message}`)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    environment: string
    version: number
  }> {
    const { environment, version } = options

    return {
      environment,
      version: parseInt(version, 10)
    }
  }
}
