import BaseCommand from '../base.command'

export default class UpdateProject extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates a project'
  }
}
