import BaseCommand from '@/commands/base.command'

export default class UpdatePat extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates the details of an existing personal access token'
  }
}
