import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class DeleteProject extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Deletes a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project that you want to delete.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().projectController.deleteProject(
        {
          projectSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(`Project ${projectSlug} deleted successfully!`)
    } else {
      Logger.error(`Failed to delete project: ${error.message}`)
    }
  }
}
