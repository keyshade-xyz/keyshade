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

  getUsage(): string {
    return `keyshade variable rollback <variable slug> [options]
  
  Rollback a variable
  keyshade variable rollback variable-1 --version 2 --environment dev
  `
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
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed to rollback variable.\n' + JSON.stringify(error))
      }
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    environment: string
    version: number
  }> {
    const { environment, version } = options

    if (!environment) {
      Logger.error('Environment slug is required')
      process.exit(1)
    }

    if (!version) {
      Logger.error('Version is required')
      process.exit(1)
    }

    return {
      environment,
      version: parseInt(version, 10)
    }
  }
}
