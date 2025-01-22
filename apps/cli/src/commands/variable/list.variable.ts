import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class ListVariable extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all variable under a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project whose variable you want.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { data, error, success } =
      await ControllerInstance.getInstance().variableController.getAllVariablesOfProject(
        {
          projectSlug
        },
        this.headers
      )

    if (success) {
      const variables = data.items
      if (variables.length > 0) {
        variables.forEach(({ variable, values }) => {
          Logger.info(`- ${variable.name} (${variable.slug})`)
          values.forEach(({ environment, value }) => {
            Logger.info(
              `  |_ ${environment.name} (${environment.slug}): ${value}`
            )
          })
        })
      } else {
        Logger.info('No variables found')
      }
    } else {
      Logger.error(`Failed fetching variables: ${error.message}`)
    }
  }
}
