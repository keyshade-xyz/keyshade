import BaseCommand from '../base.command'

export default class ListProjectForks extends BaseCommand {
  getName(): string {
    return 'list-forks'
  }

  getDescription(): string {
    return 'List all forks of a project'
  }
}
