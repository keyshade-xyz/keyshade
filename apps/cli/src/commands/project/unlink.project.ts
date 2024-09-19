import BaseCommand from '../base.command'

export default class UnlinkProject extends BaseCommand {
  getName(): string {
    return 'unlink'
  }

  getDescription(): string {
    return 'Unlinks a forked project from its parent project'
  }
}
