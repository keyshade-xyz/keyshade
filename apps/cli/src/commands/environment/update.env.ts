import BaseCommand from '../base.command'

export class UpdateEnvironment extends BaseCommand {
  getName(): string {
    return 'update'
  }
  getDescription(): string {
    return 'Update a environment'
  }
}
