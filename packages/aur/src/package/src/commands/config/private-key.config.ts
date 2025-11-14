import BaseCommand from '../base.command'
import AddPrivateKey from './private-key/add.private-key'
import DeletePrivateKey from './private-key/delete.private-key'
import ListPrivateKey from './private-key/list.private-key'
import UpdatePrivateKey from './private-key/update.private-key'

export default class PrivateKeyConfig extends BaseCommand {
  getName(): string {
    return 'private-key'
  }

  getDescription(): string {
    return 'Manage your private keys'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new AddPrivateKey(),
      new ListPrivateKey(),
      new UpdatePrivateKey(),
      new DeletePrivateKey()
    ]
  }
}
