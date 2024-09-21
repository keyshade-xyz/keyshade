import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class SyncProject extends BaseCommand {
  getName(): string {
    return 'sync'
  }

  getDescription(): string {
    return 'Sync a forked project with its parent'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description:
          'Slug of the forked project that you want to sync with its parent.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-h',
        long: '--hard-sync',
        description:
          'Upserts a new copy of the parent onto the child. Defaults to soft sync'
      }
    ]
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().projectController.syncFork(
        {
          projectSlug,
          hardSync: options.hardSync !== undefined
        },
        this.headers
      )

    if (success) {
      Logger.info(`Project ${projectSlug} synced successfully!`)
    } else {
      Logger.error(`Failed to sync project: ${error.message}`)
    }
  }
}
