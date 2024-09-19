import BaseCommand from '../base.command'

export default class CreateProject extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Creates a project'
  }
}
