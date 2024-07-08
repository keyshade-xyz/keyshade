import BaseCommand from '../base.command'

export class CreateEnvironment extends BaseCommand {
  getName(): string {
    return 'create'
  }
  getDescription(): string {
    return 'Create a new environment'
  }
}
