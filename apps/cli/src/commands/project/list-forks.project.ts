import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class ListProjectForks extends BaseCommand {
  getName(): string {
    return 'list-forks'
  }

  getDescription(): string {
    return 'List all forks of a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project whose forks you want to list.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.getForks(
        { projectSlug },
        this.headers
      )

    if (success) {
      const projects = data.items
      if (projects.length > 0) {
        data.items.forEach((project: any) => {
          Logger.info(`- ${project.name} (${project.slug})`)
        })
      } else {
        Logger.info('No forks found')
      }
    } else {
      Logger.error(`Failed fetching forks: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report(
          'Failed fetching project forks.\n' + JSON.stringify(error)
        )
      }
    }
  }
}
