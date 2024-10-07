import BaseCommand from '@/commands/base.command'

export default class WorkspaceCommand extends BaseCommand {
  getName(): string {
    return 'secret'
  }

  getDescription(): string {
    return 'Manages the secrets on keyshade'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreateWorkspace(), //change these
      new DeleteWorkspace(),
      new ExportWorkspace(),
      new GetWorkspace(),
      new ListWorkspace(),
      new SearchWorkspace(),
      new UpdateWorkspace(),
      new WorkspaceRoleCommand()
    ]
  }
}
