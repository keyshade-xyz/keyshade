import BaseCommand from '../base.command'

export class UpdateIntegration extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Update an integration'
  }

  canMakeHttpRequests(): boolean {
    return true
  }
}
