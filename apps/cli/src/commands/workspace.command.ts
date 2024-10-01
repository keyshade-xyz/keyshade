import BaseCommand from '@/commands/base.command'
import CreateWorkspace from '@/commands/workspace/create.workspace'
import DeleteWorkspace from '@/commands/workspace/delete.workspace'
import ExportWorkspace from '@/commands/workspace/export.workspace'
import GetWorkspace from '@/commands/workspace/get.workspace'
import ListWorkspace from '@/commands/workspace/list.workspace'
import SearchWorkspace from '@/commands/workspace/search.workspace'
import UpdateWorkspace from '@/commands/workspace/update.workspace'
import WorkspaceRoleCommand from '@/commands/workspace/role.workspace'

export default class WorkspaceCommand extends BaseCommand {
  getName(): string {
    return 'workspace'
  }

  getDescription(): string {
    return 'Manages the workspaces on keyshade'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreateWorkspace(),
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
