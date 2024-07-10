import BaseCommand from './base.command'
import { CreateEnvironment } from './environment/create.env'
import { DeleteEnvironment } from './environment/delete.env'
import { GetEnvironment } from './environment/get.env'
import { ListEnvironment } from './environment/list.env'
import { UpdateEnvironment } from './environment/update.env'

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
