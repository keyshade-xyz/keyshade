import BaseCommand from '@/commands/base.command'
import CreateSecret from '@/commands/secret/create.secret'
import DeleteSecret from '@/commands/secret/delete.secret'
import ListSecret from '@/commands/secret/list.secret'
import FetchSecretRevisions from '@/commands/secret/revisions.secret'
import UpdateSecret from '@/commands/secret/update.secret'
import RollbackSecret from '@/commands/secret/rollback.secret'

export default class SecretCommand extends BaseCommand {
  getName(): string {
    return 'secret'
  }

  getDescription(): string {
    return 'Manages the secrets on keyshade'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreateSecret(),
      new DeleteSecret(),
      new ListSecret(),
      new FetchSecretRevisions(),
      new UpdateSecret(),
      new RollbackSecret()
    ]
  }
}
