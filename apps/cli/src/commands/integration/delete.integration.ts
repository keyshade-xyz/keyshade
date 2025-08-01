import BaseCommand from '../base.command'

export class DeleteIntegration extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete an integration'
  }

  canMakeHttpRequests(): boolean {
    return true
  }
}
