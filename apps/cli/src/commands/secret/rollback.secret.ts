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

  getUsage(): string {
    return `keyshade secret rollback <secret slug> [options]

  Rollback a secret
  keyshade secret rollback secret-1 --version 2 --environment dev
  `
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
      this.logError('Failed to rollback secret', error)
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
