import BaseCommand from '../base.command'

export class CreateIntegration extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Create an integration'
  }

  canMakeHttpRequests(): boolean {
    return true
  }
}
