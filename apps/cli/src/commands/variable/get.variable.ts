import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class GetVariable extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Get all variables under a project and environment'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project whose variables you want.'
      },
      {
        name: '<Environment Slug>',
        description: 'Slug of the environment whose variables you want.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug, environmentSlug] = args
    const { data, error, success } =
      await ControllerInstance.getInstance().variableController.getAllVariablesOfEnvironment(
        {
          projectSlug,
          environmentSlug
        },
        this.headers
      )

    if (success) {
      const variables = data

      if (variables.length > 0) {
        variables.forEach((variable) => {
          Logger.info(`- ${variable.name} (${variable.value})`)
        })
      } else {
        Logger.info('No variables found')
      }
    } else {
      Logger.error(`Failed fetching secret: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report(
          'Failed fetching variables for environment.\n' + JSON.stringify(error)
        )
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
