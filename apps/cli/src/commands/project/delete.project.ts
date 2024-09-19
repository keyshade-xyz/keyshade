import BaseCommand from '../base.command'

export default class DeleteProject extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Deletes a project'
  }
}
