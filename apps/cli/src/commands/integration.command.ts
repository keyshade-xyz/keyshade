import BaseCommand from './base.command'

export default class IntegrationCommand extends BaseCommand {
  getName(): string {
    return 'integration'
  }

  getDescription(): string {
    return 'Manage your integrations in keyshade.'
  }

  canMakeHttpRequests(): boolean {
    return true
  }
}
