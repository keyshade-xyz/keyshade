import BaseCommand from '../base.command'

export class ListIntegration extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List an integration'
  }

  canMakeHttpRequests(): boolean {
    return true
  }
}
