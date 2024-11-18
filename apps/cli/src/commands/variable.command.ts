import BaseCommand from '@/commands/base.command'
import CreateVariable from '@/commands/variable/create.variable'
import DeleteVariable from '@/commands/variable/delete.variable'
import ListVariable from '@/commands/variable/list.variable'
import FetchVariableRevisions from '@/commands/variable/revisions.variable'
import UpdateVariable from '@/commands/variable/update.variable'
import RollbackVariable from '@/commands/variable/rollback.variable'

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
