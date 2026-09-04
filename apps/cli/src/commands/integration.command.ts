import BaseCommand from './base.command'
import VerifyIntegration from './integration/verify.integration'

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

  getSubCommands(): BaseCommand[] {
    return [new VerifyIntegration()]
  }
}
