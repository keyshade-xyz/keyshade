import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class ListSecret extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all secrets under a project and environment'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project whose secrets you want.'
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
      }
    }
  }
}
