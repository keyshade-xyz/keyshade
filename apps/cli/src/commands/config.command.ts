import BaseCommand from './base.command'
import PrivateKeyConfig from './config/private-key.config'
import UpdateConfig from './config/update.config'
import InitConfigCommand from './config/init.config'
import ValidateConfigCommand from './config/validate.config'
import GlobalConfigCommand from './config/global.config'

export default class ConfigCommand extends BaseCommand {
  getName(): string {
    return 'config'
  }

  getDescription(): string {
    return 'Manage your keyshade configuration file and private keys'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new PrivateKeyConfig(),
      new UpdateConfig(),
      new InitConfigCommand(),
      new ValidateConfigCommand(),
      new GlobalConfigCommand()
    ]
  }
}
