import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class ListSecret extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all secrets under a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project whose secrets you want.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-d',
        long: '--decrypt-value',
        description:
          'Set this to true if the project contains the private key. If set to true, the values of the secret will be in plaintext format'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().secretController.getAllSecretsOfProject(
        {
          projectSlug
        },
        this.headers
      )

    if (success) {
      const secrets = data.items
      if (secrets.length > 0) {
        secrets.forEach(({ secret, values }) => {
          Logger.info(`- ${secret.name} (${secret.slug})`)
          values.forEach(({ environment, value }) => {
            Logger.info(
              `  |_ ${environment.name} (${environment.slug}): ${value}`
            )
          })
        })
      } else {
        Logger.error(`Failed fetching secrets: ${error.message}`)
        if (this.metricsEnabled && error?.statusCode === 500) {
          Logger.report(
            'Failed fetching secrets for project.\n' + JSON.stringify(error)
          )
        }
      }
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    decryptValue: boolean
  }> {
    const { decryptValue = false } = options // defaults to false
    return {
      decryptValue
    }
  }
}
