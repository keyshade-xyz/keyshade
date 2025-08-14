import BaseCommand from './base.command'
import { CreateIntegration } from './integration/create.integration'
import { DeleteIntegration } from './integration/delete.integration'
import { GetIntegration } from './integration/get.integration'
import { ListIntegration } from './integration/list.integration'
import { UpdateIntegration } from './integration/update.integration'

export default class IntegrationCommand extends BaseCommand {
  getName(): string {
    return 'integration'
  }

  getDescription(): string {
    return 'Manage your integrations in keyshade.'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreateIntegration(),
      new DeleteIntegration(),
      new GetIntegration(),
      new ListIntegration(),
      new UpdateIntegration()
    ]
  }
}
