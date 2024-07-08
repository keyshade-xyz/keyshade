import BaseCommand from '../base.command'

export class DeleteEnvironment extends BaseCommand {
  getName(): string {
    return 'delete'
  }
  getDescription(): string {
    return 'Delete a environment'
  }
}
