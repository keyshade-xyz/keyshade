import BaseCommand from '../base.command'
import type { CommandOption } from '@/types/command/command.types'

export class DeleteIntegration extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete an integration'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-c',
        long: '--clean-up',
        description: 'Makes the integration clean up the data that it created.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }
}
