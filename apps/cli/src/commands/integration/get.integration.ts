import BaseCommand from '../base.command'

export class GetIntegration extends BaseCommand {
  getName(): string {
    return 'get'
  }

  getDescription(): string {
    return 'Get an integration'
  }

  canMakeHttpRequests(): boolean {
    return true
  }
}
