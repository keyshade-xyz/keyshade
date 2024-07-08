import BaseCommand from '../base.command'

export class ListEnvironment extends BaseCommand {
  getName(): string {
    return 'list'
  }
  getDescription(): string {
    return 'List all environments'
  }
}
