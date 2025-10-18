import BaseCommand from '../base.command'
import CreateRoleCommand from './role/create.role'
import DeleteRoleCommand from './role/delete.role'
import GetRoleCommand from './role/get.role'
import ListRoleCommand from './role/list.role'
import UpdateRoleCommand from './role/update.role'

export default class WorkspaceRoleCommand extends BaseCommand {
  getName(): string {
    return 'role'
  }

  getDescription(): string {
    return 'Manage workspace roles'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreateRoleCommand(),
      new ListRoleCommand(),
      new GetRoleCommand(),
      new DeleteRoleCommand(),
      new UpdateRoleCommand()
    ]
  }
}
