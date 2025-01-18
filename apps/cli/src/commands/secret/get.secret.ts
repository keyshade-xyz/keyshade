import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class GetSecret extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'get all secrets under a project and environment'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project whose secrets you want.'
      },
      {
        name: '<Environment Slug>',
        description: 'Slug of the environment whose secrets you want.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug, environmentSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().secretController.getAllSecretsOfEnvironment(
        {
          projectSlug,
          environmentSlug
        },
        this.headers
      )

    if (success) {
      const secrets = data

      if (secrets.length > 0) {
        secrets.forEach((secret) => {
          Logger.info(`- ${secret.name} (${secret.value})`)
        })
      } else {
        Logger.error(`Failed fetching secrets: ${error.message}`)
        if (this.metricsEnabled && error?.statusCode === 500) {
          Logger.report(
            'Failed fetching secrets for environment.\n' + JSON.stringify(error)
          )
        }
      }
    }
  }
}
