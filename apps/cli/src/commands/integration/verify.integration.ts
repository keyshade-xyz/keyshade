import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class VerifyIntegration extends BaseCommand {
  getName(): string {
    return 'verify'
  }

  getDescription(): string {
    return 'Verifies the configuration and connectivity of an integration'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Integration Slug>',
        description: 'Slug of the integration which you want to verify.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [integrationSlug] = args

    if (!integrationSlug) {
      throw new Error('Integration slug is required.')
    }

    Logger.info(`Verifying integration ${integrationSlug}...`)

    const { data, error, success } =
      await ControllerInstance.getInstance().integrationController.verifyIntegration(
        {
          integrationSlug
        },
        this.headers
      )

    if (success && data?.success) {
      Logger.info(
        data.message || 'Integration configuration verified successfully!'
      )
    } else {
      this.logError(error)
    }
  }
}
