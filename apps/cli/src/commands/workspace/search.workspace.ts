import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class SearchWorkspace extends BaseCommand {
  getName(): string {
    return 'search'
  }

  getDescription(): string {
    return 'Performs a full-text search for projects, secrets, variables and environments in a workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to search.'
      },
      {
        name: '<Search Term>',
        description: 'Search term that you want to search for.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug, searchTerm] = args

    const { data, success, error } =
      await ControllerInstance.getInstance().workspaceController.globalSearch(
        {
          workspaceSlug,
          search: searchTerm
        },
        this.headers
      )

    if (success) {
      Logger.info('Search results:')

      Logger.info('')

      Logger.info(`Projects (${data.projects.length})`)
      data.projects.forEach((project) => {
        Logger.info(`- ${project.name} (${project.slug})`)
      })

      Logger.info('')

      Logger.info(`Environments (${data.environments.length})`)
      data.environments.forEach((environment) => {
        Logger.info(`- ${environment.name} (${environment.slug})`)
      })

      Logger.info('')

      Logger.info(`Variables (${data.variables.length})`)
      data.variables.forEach((variable) => {
        Logger.info(`- ${variable.name} (${variable.slug})`)
      })

      Logger.info('')

      Logger.info(`Secrets (${data.secrets.length})`)
      data.secrets.forEach((secret) => {
        Logger.info(`- ${secret.name} (${secret.slug})`)
      })

      Logger.info('')
    } else {
      Logger.error(`Failed searching in workspace: ${error.message}`)
    }
  }
}
