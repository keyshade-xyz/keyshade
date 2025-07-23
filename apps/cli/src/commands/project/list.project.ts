import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import { Table } from '@/util/table'

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

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args
    Logger.header(`Fetching all projects for ${workspaceSlug}...`)

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
        const headers = ['#', '📁 Project Name', '🆔 Project Slug']
        const rows = projects.map((project: any, index: number) => [
          (index + 1).toString(),
          project.name,
          project.slug
        ])

        Table.render(headers, rows)
      } else {
        Logger.info('No projects found')
      }
    } else {
      this.logError(error)
    }
  }
}
