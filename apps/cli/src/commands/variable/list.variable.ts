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
      const variable = data
      if (variable.length > 0) {
        data.forEach((variable: any) => {
          Logger.info(`- ${variable.name} (${variable.value})`)
        })
      } else {
        Logger.info('No variable found')
      }
    } else {
      Logger.error(`Failed fetching variables: ${error.message}`)
    }
  }
}
