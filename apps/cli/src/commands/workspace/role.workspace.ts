import BaseCommand from '../base.command'
import GetRoleCommand from './role/get.role'
import ListRoleCommand from './role/list.role'

export default class WorkspaceRoleCommand extends BaseCommand {
  getName(): string {
    return 'role'
  }

  getDescription(): string {
    return 'Manage workspace roles'
  }

  getSubCommands(): BaseCommand[] {
    return [new ListRoleCommand(), new GetRoleCommand()]
  }
}
