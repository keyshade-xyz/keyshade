import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class GetSecret extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Get all secrets under a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project whose secrets you want.'
      }
    ]
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

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { decryptValue } = await this.parseInput(options)
    const { data, error, success } =
      await ControllerInstance.getInstance().secretController.getAllSecretsOfProject(
        {
          projectSlug,
          decryptValue
        },
        this.headers
      )

    if (success) {
      const secrets = data.items

      if (secrets.length > 0) {
        data.items.forEach((item: any) => {
          const secret = item.secret
          Logger.info(`- ${secret.name} (${secret.slug})`)
        })
      } else {
        Logger.info('No secrets found')
      }
    } else {
      Logger.error(`Failed fetching secrets: ${error.message}`)
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
