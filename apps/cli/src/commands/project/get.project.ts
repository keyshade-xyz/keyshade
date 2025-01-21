import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class GetProject extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Fetches a particular project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project which you want to fetch.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.getProject(
        {
          projectSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(`Name: ${data.name}`)
      Logger.info(`Slug: ${data.slug}`)
      Logger.info(`Description: ${data.description}`)
      Logger.info(`Public Key: ${data.publicKey}`)
      Logger.info(`Private Key: ${data.privateKey}`)
      Logger.info(`Is Forked: ${data.isForked}`)
      Logger.info(`Access Level: ${data.accessLevel}`)
    } else {
      Logger.error(`Failed fetching project: ${error.message}`)
    }
  }
}
