import BaseCommand from '../base.command'

export class GetEnvironment extends BaseCommand {
  getName(): string {
    return 'get'
  }
  getDescription(): string {
    return 'Get a environment'
  }
}
