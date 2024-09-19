import BaseCommand from './base.command'
import CreateProject from './project/create.project'
import DeleteProject from './project/delete.project'
import ForkProject from './project/fork.project'
import GetProject from './project/get.project'
import ListProjectForks from './project/list-forks.project'
import ListProject from './project/list.project'
import SyncProject from './project/sync.project'
import UnlinkProject from './project/unlink.project'
import UpdateProject from './project/update.project'

export default class ProjectCommand extends BaseCommand {
  getName(): string {
    return 'project'
  }

  getDescription(): string {
    return 'Manage projects of a workspace'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreateProject(),
      new DeleteProject(),
      new ForkProject(),
      new GetProject(),
      new ListProjectForks(),
      new ListProject(),
      new SyncProject(),
      new UnlinkProject(),
      new UpdateProject()
    ]
  }
}
