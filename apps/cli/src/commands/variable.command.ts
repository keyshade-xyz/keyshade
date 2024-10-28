import BaseCommand from '@/commands/base.command'
import CreateVariable from './variable/create.variable'
import DeleteVariable from './variable/delete.variable'
import ListVariable from './variable/list.variable'
import FetchVariableRevisions from './variable/revisions.variable'
import UpdateVariable from './variable/update.variable'
import RollbackVariable from './variable/rollback.variable'

export default class VariableCommand extends BaseCommand {
  getName(): string {
    return 'variable'
  }

  getDescription(): string {
    return 'Manages the variable on keyshade'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreateVariable(),
      new DeleteVariable(),
      new ListVariable(),
      new FetchVariableRevisions(),
      new UpdateVariable(),
      new RollbackVariable()
    ]
  }
}
