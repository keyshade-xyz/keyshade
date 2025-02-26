import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class GetRoleCommand extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Get workspace role'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Role Slug>',
        description: 'Slug of the workspace role you want to fetch.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceRoleSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().workspaceRoleController.getWorkspaceRole(
        {
          workspaceRoleSlug
        },
        this.headers
      )

    if (success) {
      Logger.info('Workspace role fetched successfully!')
      Logger.info(`Workspace role: ${data.name} (${data.slug})`)
      Logger.info(`Description: ${data.description || 'N/A'}`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
      Logger.info('Authorities:')
      for (const authority of data.authorities) {
        Logger.info(`- ${authority}`)
      }
      Logger.info('Projects:')
      for (const project of data.projects) {
        Logger.info(`- ${project.project.name} (${project.project.slug})`)
      }
    } else {
      this.logError(error)
    }
  }
}
