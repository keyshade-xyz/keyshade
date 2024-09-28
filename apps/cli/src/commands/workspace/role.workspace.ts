import BaseCommand from '../base.command'

export default class WorkspaceRoleCommand extends BaseCommand {
  getName(): string {
    return 'role'
  }

  getDescription(): string {
    return 'Manage workspace roles'
  }
}
