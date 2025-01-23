import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class RollbackSecret extends BaseCommand {
  getName(): string {
    return 'rollback'
  }

  getDescription(): string {
    return 'Rollbacks a secret'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Secret Slug>',
        description: 'Slug of the secret that you want to rollback'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-v',
        long: '--version <string>',
        description: 'Version of the secret to which you want to rollback'
      },
      {
        short: '-e',
        long: '--environment <string>',
        description:
          'Slug of the environment of the secret to which you want to rollback'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [secretSlug] = args
    const { environment, version } = await this.parseInput(options)

    const { data, error, success } =
      await ControllerInstance.getInstance().secretController.rollbackSecret(
        {
          environmentSlug: environment,
          version,
          secretSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(`Secret rolled back by ${data.count} versions successfully.`)
    } else {
      Logger.error(`Failed to rollback secret: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed to rollback secret.\n' + JSON.stringify(error))
      }
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
