import BaseCommand from '../base.command'

export default class SyncProject extends BaseCommand {
  getName(): string {
    return 'sync'
  }

  getDescription(): string {
    return 'Sync a forked project with its parent'
  }
}
