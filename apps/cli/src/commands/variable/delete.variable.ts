import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class DeleteVariable extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Deletes a variable'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Variable Slug>',
        description: 'Slug of the variable that you want to delete.'
      }
    ]
  }

  getUsage(): string {
    return `keyshade variable delete <variable slug>

  Delete a variable
  keyshade variable delete variable-1
  `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [variableSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().variableController.deleteVariable(
        {
          variableSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(`Variable ${variableSlug} deleted successfully!`)
    } else {
      this.logError('Failed to delete variable', error)
    }
  }
}
