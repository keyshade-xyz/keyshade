import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class UnlinkProject extends BaseCommand {
  getName(): string {
    return 'unlink'
  }

  getDescription(): string {
    return 'Unlinks a forked project from its parent project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description:
          'Slug of the forked project that you want to unlink from its parent.'
      }
    ]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().projectController.unlinkFork(
        {
          projectSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(`Project ${projectSlug} unlinked successfully!`)
    } else {
      Logger.error(`Failed to unlink project: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed to unlink project.\n' + JSON.stringify(error))
      }
    }
  }
}
