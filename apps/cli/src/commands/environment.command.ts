import BaseCommand from './base.command'
import { CreateEnvironment } from './environment/create.environment'
import { DeleteEnvironment } from './environment/delete.environment'
import { GetEnvironment } from './environment/get.environment'
import { ListEnvironment } from './environment/list.environment'
import { UpdateEnvironment } from './environment/update.environment'

export class EnvironmentCommand extends BaseCommand {
  getName(): string {
    return 'environment'
  }
  getDescription(): string {
    return 'Manage your environments in keyshade.'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreateEnvironment(),
      new DeleteEnvironment(),
      new GetEnvironment(),
      new ListEnvironment(),
      new UpdateEnvironment()
    ]
  }
}
