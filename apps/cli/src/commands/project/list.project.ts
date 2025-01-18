import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class ListProject extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all projects of a workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace whose projects you want.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.getAllProjects(
        {
          workspaceSlug
        },
        this.headers
      )

    if (success) {
      const projects = data.items

      if (projects.length > 0) {
        data.items.forEach((project: any) => {
          Logger.info(`- ${project.name} (${project.slug})`)
        })
      } else {
        Logger.info('No projects found')
      }
    } else {
      Logger.error(`Failed fetching projects: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed fetching projects.\n' + JSON.stringify(error))
      }
    }
  }
}
